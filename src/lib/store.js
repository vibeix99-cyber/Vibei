export const CATEGORIES = [
  {
    name: 'Gourmet Food & Staple',
    slug: 'gourmet-food',
    blurb: 'Wild apples, bamboo shoots, king chili pickles & hill-grown coffee.',
  },
  {
    name: 'Handloom & Handicrafts',
    slug: 'handloom',
    blurb: 'Backstrap-loom shawls, mufflers & sling bags woven by tribal artisans.',
  },
  { name: 'Gifts', slug: 'gifts', blurb: 'Keepsakes, fridge magnets & souvenirs to carry Nagaland home.' },
  { name: 'Cosmetics', slug: 'cosmetics', blurb: 'Natural, hill-sourced skincare and beauty essentials.' },
  { name: 'Fashion', slug: 'fashion', blurb: 'Contemporary apparel rooted in tribal motifs.' },
  { name: 'Books', slug: 'books', blurb: 'Stories, folklore and histories of the Naga hills.' },
];

// Subcategory tags mirrored from the original madeinnagalandcenter.in mega-menu.
// Each tag maps to an in-app search so the link actually resolves to products.
export const CATEGORY_TAGS = {
  'gourmet-food': ['Dry Fruits', 'Beverages', 'Tea', 'Coffee', 'Spices', 'Pickles', 'Non-Veg', 'Veg', 'Oils', 'Food Crops'],
  handloom: ['Shawl', 'Necktie', 'Wood Products', 'Traditional Muffler', 'Waistcoat', 'Bags', 'Banana Fiber'],
  gifts: ['Immunity Booster', 'Notebook', 'Stickers', 'Fridge Magnet', 'Home Decor', 'Pop Socket', 'Fragrance', 'Key Chain', 'Art'],
  cosmetics: ['Handmade Soap', 'Handmade Foot Soap', 'Handmade Shampoo Bar'],
  fashion: ['Jewellery', 'T-shirts'],
  books: [],
};

// Verbatim About copy carried over from the original site.
export const ABOUT_TEXT =
  'Made in Nagaland is a centralized platform promoting local entrepreneurs and their products from Nagaland, both within and beyond the state. Discover unique handicrafts, textiles, fashion, food products, and more. Support the rich cultural heritage of Nagaland while empowering local businesses. Explore the diverse range of authentic Nagaland-made products online and experience the essence of this vibrant state.';

// Central contact details (single source of truth for header/footer/contact).
export const CONTACT = {
  phone: '(+91) 9362356143',
  phoneHref: 'tel:+919362356143',
  email: 'madeinnagalandstore@gmail.com',
  address: 'Opposite to Nagaland Civil Secretariat, Kohima Nagaland',
  facebook: 'https://www.facebook.com/madeinnagaland',
  instagram: 'https://www.instagram.com/madeinnagalandcentre',
};

export const tagHref = (tag) => `/products?q=${encodeURIComponent(tag.toLowerCase())}`;

export const formatINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);
export const slugForCategory = (name) => CATEGORIES.find((c) => c.name === name)?.slug || '';