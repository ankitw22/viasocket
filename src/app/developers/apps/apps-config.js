// 12 = 3 columns x 4 rows on desktop, 2 x 6 on phones, so a page always fills
// whole rows and the grid keeps one fixed size as you page through.
export const PAGE_SIZE = 12;

// The plugins API has no public categories endpoint, so these are the largest
// real category names in the catalog (each verified to return apps). The apps
// inside them are always live.
export const CATEGORIES = [
    'All',
    'Productivity',
    'AI Tools',
    'Developer Tools',
    'Marketing',
    'Communication',
    'Team Collaboration',
    'Analytics',
    'Project Management',
    'CRM',
    'Customer Support',
    'eCommerce',
    'Accounting',
    'Finance',
];
