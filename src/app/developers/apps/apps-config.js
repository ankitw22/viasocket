// 36 = 6 columns x 6 rows on desktop, 4 x 9 on phones, so a page always fills
// whole rows and the grid keeps one fixed size as you page through.
export const PAGE_SIZE = 36;

// The API sends long descriptions and a dozen other fields per app; the grid
// only needs these five, so everything else is dropped before it reaches the client.
export const slimApp = (a) => ({
    rowid: a.rowid,
    name: a.name,
    appslugname: a.appslugname,
    iconurl: a.iconurl,
    brandcolor: a.brandcolor,
});

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
