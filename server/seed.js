import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import Product from './models/Product.js';

const toyCatalog = [
  ['Rainbow Stacking Rings', 'Learning & Development', '18 months+', 499, 4.8, 124, 'Soft, colourful rings help little hands learn size, colour and coordination.', ['BPA-free', 'Lightweight', 'Easy to grip']],
  ['Wooden Alphabet Blocks', 'Educational', '2 years+', 749, 4.7, 98, 'Twenty-six smooth wooden blocks make every letter feel like a new adventure.', ['Natural wood', 'Rounded edges', '26 pieces']],
  ['Rocket Building Set', 'STEM', '5 years+', 1299, 4.9, 216, 'A bright construction kit for curious builders who dream about space.', ['112 pieces', 'Idea booklet', 'Reusable storage box']],
  ['Cuddly Brown Teddy', 'Soft Toys', '0 years+', 899, 4.9, 342, 'A cloud-soft companion made for bedtime stories and brave little adventures.', ['Machine washable', 'Hypoallergenic fill', '35 cm']],
  ['Mini Kitchen Play Set', 'Pretend Play', '3 years+', 1899, 4.6, 175, 'A complete pretend kitchen with playful sounds and colourful accessories.', ['Pretend sounds', '18 accessories', 'Easy assembly']],
  ['Dinosaur Figure Pack', 'Imaginative Play', '3 years+', 649, 4.7, 143, 'Roar into imaginative play with twelve detailed dinosaurs and a fact card.', ['12 dinosaurs', 'Fact cards', 'Travel pouch']],
  ['Magnetic Tile Castle', 'STEM', '4 years+', 1599, 4.8, 188, 'Click-and-build tiles turn bright ideas into castles, towers and bridges.', ['64 tiles', 'Strong magnets', 'Idea guide']],
  ['Pull-Along Duck Family', 'Early Walkers', '12 months+', 549, 4.6, 87, 'A cheerful duck family waddles behind little explorers as they find their feet.', ['Smooth pull cord', 'Rattle sound', 'Rounded design']],
  ['Art Easel Deluxe', 'Creativity', '3 years+', 2199, 4.7, 76, 'A sturdy double-sided easel for chalk, paint and big imaginative masterpieces.', ['Double sided', 'Paper roll', 'Storage tray']],
  ['Remote Control Dino', 'Remote Control', '6 years+', 1499, 4.5, 132, 'A friendly remote-control dinosaur that walks, roars and lights up.', ['Rechargeable', '2.4 GHz remote', 'LED eyes']],
  ['Farm Animal Puzzle', 'Puzzles', '2 years+', 399, 4.8, 111, 'Chunky wooden puzzle pieces introduce friendly farm animals and sounds.', ['18 pieces', 'Wooden board', 'Easy hold tabs']],
  ['Doctor Care Kit', 'Pretend Play', '3 years+', 799, 4.7, 154, 'A complete little doctor kit for check-ups, care and comforting patients.', ['12 accessories', 'Carry case', 'No sharp edges']],
  ['Balance Bike Coral', 'Outdoor Play', '2 years+', 3499, 4.9, 203, 'A lightweight balance bike that helps children build confidence and coordination.', ['Puncture-proof tyres', 'Adjustable seat', 'Safety grips']],
  ['Musical Animal Band', 'Music', '18 months+', 999, 4.6, 92, 'Tap, shake and jingle with a cheerful band of musical animal friends.', ['5 instruments', 'Volume control', 'Bright colours']],
  ['Solar System Model', 'Educational', '6 years+', 1199, 4.8, 67, 'Build a glowing solar system and learn how our neighbourhood of planets moves.', ['Glow pieces', 'Fact booklet', 'Display stand']],
  ['Princess Castle Tent', 'Pretend Play', '2 years+', 1699, 4.7, 165, 'A magical pop-up castle for tea parties, royal meetings and quiet reading.', ['Pop-up design', 'Mesh window', 'Carry bag']],
  ['Coding Robot Kit', 'STEM', '7 years+', 2499, 4.9, 89, 'Screen-free coding challenges teach sequencing and problem solving through play.', ['40 challenges', 'No screen needed', 'Robot mascot']],
  ['Wooden Train Railway', 'Classic Toys', '3 years+', 1999, 4.8, 221, 'A colourful wooden railway with stations, bridges and friendly rolling stock.', ['48 pieces', 'Compatible tracks', 'Storage box']],
  ['Bubble Blower Party', 'Outdoor Play', '3 years+', 449, 4.5, 128, 'A cheerful bubble machine fills the garden with shimmering, floating fun.', ['USB rechargeable', 'Bubble solution included', 'Easy carry handle']],
  ['Plush Unicorn Sparkle', 'Soft Toys', '0 years+', 1099, 4.9, 289, 'A silky-soft unicorn with a shimmering mane and a very gentle smile.', ['Super soft', 'Embroidered eyes', '40 cm']],
  ['Marble Run Explorer', 'STEM', '5 years+', 1799, 4.8, 147, 'Design colourful marble paths and discover gravity one satisfying drop at a time.', ['86 pieces', '30 marbles', 'Challenge cards']],
  ['Toy Tool Bench', 'Pretend Play', '3 years+', 1399, 4.6, 118, 'A junior workshop for tiny builders, with screws, gears and pretend repairs.', ['28 accessories', 'Workbench', 'Safe plastic tools']],
  ['Ocean Rescue Boat', 'Bath Toys', '2 years+', 599, 4.7, 96, 'A floating rescue boat with a spinning propeller and splashy ocean friends.', ['Water proof', 'No batteries', 'Bath cup included']],
  ['Junior Scientist Lab', 'STEM', '6 years+', 1899, 4.8, 73, 'Safe, colourful experiments introduce curious minds to the joy of discovery.', ['20 experiments', 'Safety goggles', 'Experiment guide']],
  ['Stacking Wooden Cars', 'Early Learning', '18 months+', 699, 4.7, 109, 'Stack, sort and roll four friendly cars while learning colours and numbers.', ['4 cars', 'Wooden', 'Rounded finish']],
  ['Dollhouse Family Home', 'Pretend Play', '3 years+', 2999, 4.8, 141, 'A three-storey dollhouse with furniture and plenty of room for everyday stories.', ['3 floors', '12 furniture pieces', 'Carry handles']],
  ['Basketball Hoop Set', 'Outdoor Play', '3 years+', 1299, 4.6, 84, 'An adjustable indoor or outdoor hoop for first baskets and victory dances.', ['Height adjustable', 'Soft ball', 'Stable base']],
  ['Magic Drawing Tablet', 'Creativity', '3 years+', 849, 4.7, 176, 'A mess-free colour drawing board with a smooth slider and stamp shapes.', ['Mess free', '4 stamps', 'Travel lock']],
  ['Fire Engine Rescue', 'Vehicles', '3 years+', 999, 4.8, 193, 'Lights, ladder and brave little firefighters make every rescue feel important.', ['Light and sound', 'Moving ladder', 'Figure included']],
  ['Shape Sorter Garden', 'Early Learning', '12 months+', 599, 4.9, 237, 'A happy garden sorter that teaches shapes, colours and fine motor skills.', ['12 shapes', 'Easy-clean', 'BPA-free']],
  ['RC Stunt Car', 'Remote Control', '6 years+', 1699, 4.6, 161, 'Flip, spin and race with a tough stunt car built for backyard challenges.', ['Rechargeable battery', '360° stunts', 'All-terrain wheels']],
  ['Teddy Picnic Basket', 'Soft Toys', '2 years+', 1199, 4.7, 83, 'A cuddly bear and woven picnic set made for imaginary afternoons outside.', ['Teddy included', 'Picnic accessories', 'Fabric basket']],
  ['Wooden abacus', 'Educational', '3 years+', 549, 4.8, 126, 'Slide colourful beads and make numbers visible for young mathematicians.', ['100 beads', 'Wooden frame', 'Non-toxic paint']],
  ['Superhero Action Figure', 'Action Figures', '4 years+', 749, 4.6, 184, 'A posable hero with interchangeable accessories and a bold rescue mission.', ['12 points articulation', '5 accessories', 'Display stand']],
  ['Play-Doh Ice Cream Cart', 'Creativity', '3 years+', 1099, 4.7, 149, 'Scoop, swirl and serve colourful pretend ice cream from a friendly cart.', ['Compound included', 'Moulds', 'Role-play cart']],
  ['Wooden Memory Match', 'Puzzles', '3 years+', 499, 4.8, 102, 'Turn over hand-painted animal tiles and find every matching pair.', ['36 tiles', 'Wooden box', 'Travel friendly']],
  ['Giant Bubble Wand', 'Outdoor Play', '3 years+', 299, 4.5, 157, 'Make enormous rainbow bubbles with a sturdy wand and extra-long handle.', ['Bubble solution', 'Durable cord', 'Outdoor fun']],
  ['Kids Microscope Kit', 'STEM', '7 years+', 2199, 4.8, 58, 'A real beginner microscope with prepared slides and a little lab notebook.', ['100x–1200x', 'Slides included', 'LED light']],
  ['Soft Building Bricks', 'Early Learning', '12 months+', 899, 4.9, 211, 'Squishy, tactile bricks are perfect for safe stacking and sensory play.', ['24 bricks', 'Soft texture', 'Easy clean']],
  ['Train Signal Playset', 'Classic Toys', '4 years+', 1299, 4.6, 79, 'A charming railway signal set with switches, signs and a station platform.', ['18 pieces', 'Wooden details', 'Expandable play']]
];

export const products = toyCatalog.map((item, index) => {
  const [name, category, age, price, rating, reviews, description, features] = item;
  return {
    name,
    slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${index + 1}`,
    category,
    age,
    price,
    mrp: Math.round(price * 1.18),
    rating,
    reviews,
    description,
    features,
    image: `https://loremflickr.com/640/480/toy,${category.toLowerCase().replace(/[^a-z0-9]+/g, ',')}?lock=${index + 1}`,
    stock: 12 + (index % 9),
    badge: index % 7 === 0 ? 'Bestseller' : index % 5 === 0 ? 'New' : '',
    colors: ['#ff6b8b', '#ffb84d', '#63d2ff', '#9b7bff']
  };
});

export async function seedProducts() {
  await connectDatabase();
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } else {
    console.log(`Products already exist: ${count}`);
  }
  mongoose.connection.close();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
