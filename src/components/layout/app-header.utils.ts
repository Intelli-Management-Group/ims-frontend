export interface Crumb {
  label: string;
  path: string;
  isPage: boolean;
}

interface BreadcrumbOverride {
  label: string;
  path: string;
}

/** Map path segments to human-friendly labels. */
export const SEGMENT_LABELS: Record<string, string> = {
  'form-builder': 'Form Builder',
  'form-templates': 'Form Templates',
};

/**
 * Routes that should display extra parent breadcrumbs.
 * Key: first path segment, Value: array of { label, path } ancestors to insert before it.
 */
export const BREADCRUMB_PARENTS: Record<string, { label: string; path: string }[]> = {
  'form-builder': [{ label: 'Form Templates', path: '/form-templates' }],
};

export function formatSegmentLabel(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Builds the full breadcrumb trail for the current path.
 * - If explicit overrides are provided (from useBreadcrumb), those are used as-is.
 * - Otherwise, derives breadcrumbs from the pathname, inserting any virtual
 *   parent crumbs configured in BREADCRUMB_PARENTS.
 */
export function buildBreadcrumbs(
  pathname: string,
  overrides?: BreadcrumbOverride[] | null
): Crumb[] {
  const breadcrumbs: Crumb[] = [];

  if (overrides) {
    overrides.forEach((crumb, index) => {
      const isLast = index === overrides.length - 1;
      breadcrumbs.push({ label: crumb.label, path: crumb.path, isPage: isLast });
    });
    return breadcrumbs;
  }

  const pathSegments = pathname.split('/').filter(Boolean);

  if (pathSegments.length > 0 && BREADCRUMB_PARENTS[pathSegments[0]]) {
    for (const parent of BREADCRUMB_PARENTS[pathSegments[0]]) {
      breadcrumbs.push({ label: parent.label, path: parent.path, isPage: false });
    }
  }

  pathSegments.forEach((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const isLast = index === pathSegments.length - 1;
    breadcrumbs.push({ label: formatSegmentLabel(segment), path, isPage: isLast });
  });

  return breadcrumbs;
}
