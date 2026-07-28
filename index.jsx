import { useState, useMemo, useRef } from "react";

const AMENITIES = [
// Accessibility
{ id: 118, name: "Accessible Height Bed", cat: "Accessibility" },
{ id: 125, name: "Accessible Height Toilet", cat: "Accessibility" },
{ id: 114, name: "Accessible Parking Spot", cat: "Accessibility" },
{ id: 123, name: "Bathtub With Bath Chair", cat: "Accessibility" },
{ id: 291, name: "Ceiling or Mobile Hoist", cat: "Accessibility" },
{ id: 288, name: "Electric Profiling Bed", cat: "Accessibility" },
{ id: 117, name: "Extra Space Around Bed", cat: "Accessibility" },
{ id: 122, name: "Fixed Grab Bars for Shower Toilet", cat: "Accessibility" },
{ id: 111, name: "Guest Entrance Wider Than 32 Inches", cat: "Accessibility" },
{ id: 113, name: "Lit Path to the Guest Entrance", cat: "Accessibility" },
{ id: 289, name: "Mobile Hoist", cat: "Accessibility" },
{ id: 124, name: "Roll in Shower With Chair", cat: "Accessibility" },
{ id: 297, name: "Shower or Bath Chair", cat: "Accessibility" },
{ id: 115, name: "Step Free Access", cat: "Accessibility" },
{ id: 110, name: "Step Free Guest Entrance", cat: "Accessibility" },
{ id: 112, name: "Step Free Path to the Guest Entrance", cat: "Accessibility" },
{ id: 296, name: "Step Free Shower", cat: "Accessibility" },
{ id: 290, name: "Swimming Pool or Hot Tub Hoist", cat: "Accessibility" },
{ id: 366, name: "Wheelchair", cat: "Accessibility" },
{ id: 6, name: "Wheelchair Accessible", cat: "Accessibility" },
{ id: 126, name: "Wide Clearance to Shower Toilet", cat: "Accessibility" },
{ id: 121, name: "Wide Doorway to Guest Bathroom", cat: "Accessibility" },
{ id: 116, name: "Wide Entrance", cat: "Accessibility" },
{ id: 128, name: "Wide Entryway", cat: "Accessibility" },
{ id: 109, name: "Wide Hallways", cat: "Accessibility" },
// Bathroom
{ id: 166, name: "Alfresco Bathtub", cat: "Bathroom" },
{ id: 81, name: "Bath Towel", cat: "Bathroom" },
{ id: 298, name: "Bathrobe", cat: "Bathroom" },
{ id: 380, name: "Bathrobes", cat: "Bathroom" },
{ id: 293, name: "Bathroom Essentials", cat: "Bathroom" },
{ id: 61, name: "Bathtub", cat: "Bathroom" },
{ id: 167, name: "Bidet", cat: "Bathroom" },
{ id: 79, name: "Body Soap", cat: "Bathroom" },
{ id: 157, name: "Dual Vanity", cat: "Bathroom" },
{ id: 275, name: "En Suite Bathroom", cat: "Bathroom" },
{ id: 84, name: "Feminine Hygiene Products", cat: "Bathroom" },
{ id: 294, name: "Fixed Grab Bars for Shower", cat: "Bathroom" },
{ id: 295, name: "Fixed Grab Bars for Toilet", cat: "Bathroom" },
{ id: 45, name: "Hair Dryer", cat: "Bathroom" },
{ id: 80, name: "Hand Soap", cat: "Bathroom" },
{ id: 82, name: "Hand or Paper Towel", cat: "Bathroom" },
{ id: 136, name: "Handheld Shower Head", cat: "Bathroom" },
{ id: 168, name: "Heated Towel Rack", cat: "Bathroom" },
{ id: 77, name: "Hot Water", cat: "Bathroom" },
{ id: 165, name: "Jetted Tub", cat: "Bathroom" },
{ id: 497, name: "Multi Jet Shower", cat: "Bathroom" },
{ id: 210, name: "Outdoor Shower", cat: "Bathroom" },
{ id: 523, name: "Powder Room", cat: "Bathroom" },
{ id: 78, name: "Private Bathroom", cat: "Bathroom" },
{ id: 164, name: "Rain Shower", cat: "Bathroom" },
{ id: 41, name: "Shampoo", cat: "Bathroom" },
{ id: 163, name: "Shower Bathtub Combo", cat: "Bathroom" },
{ id: 299, name: "Slippers", cat: "Bathroom" },
{ id: 281, name: "Soaking Tub", cat: "Bathroom" },
{ id: 162, name: "Stand Alone Bathtub", cat: "Bathroom" },
{ id: 158, name: "Stand Alone Jetted Bathtub", cat: "Bathroom" },
{ id: 160, name: "Stand Alone Rain Shower", cat: "Bathroom" },
{ id: 159, name: "Stand Alone Shower", cat: "Bathroom" },
{ id: 161, name: "Stand Alone Steam Shower", cat: "Bathroom" },
{ id: 83, name: "Toilet Paper", cat: "Bathroom" },
{ id: 156, name: "Triple Vanity", cat: "Bathroom" },
{ id: 283, name: "Walk in Shower", cat: "Bathroom" },
// Bedroom & Laundry
{ id: 85, name: "Bed Linens", cat: "Bedroom & Laundry" },
{ id: 292, name: "Bedroom Comforts", cat: "Bedroom & Laundry" },
{ id: 305, name: "Blinds", cat: "Bedroom & Laundry" },
{ id: 303, name: "Clock Radio", cat: "Bedroom & Laundry" },
{ id: 413, name: "Clothes Steamer", cat: "Bedroom & Laundry" },
{ id: 414, name: "Coatroom", cat: "Bedroom & Laundry" },
{ id: 149, name: "Desk", cat: "Bedroom & Laundry" },
{ id: 148, name: "Dressing Area", cat: "Bedroom & Laundry" },
{ id: 34, name: "Dryer", cat: "Bedroom & Laundry" },
{ id: 86, name: "Extra Pillows and Blankets", cat: "Bedroom & Laundry" },
{ id: 445, name: "Frette Sheets", cat: "Bedroom & Laundry" },
{ id: 44, name: "Hangers", cat: "Bedroom & Laundry" },
{ id: 46, name: "Iron", cat: "Bedroom & Laundry" },
{ id: 304, name: "Ironing Board", cat: "Bedroom & Laundry" },
{ id: 253, name: "Large Mirror", cat: "Bedroom & Laundry" },
{ id: 42, name: "Lock on Bedroom Door", cat: "Bedroom & Laundry" },
{ id: 147, name: "Lounge Area", cat: "Bedroom & Laundry" },
{ id: 270, name: "Memory Foam Mattress", cat: "Bedroom & Laundry" },
{ id: 273, name: "Murphy Bed", cat: "Bedroom & Laundry" },
{ id: 513, name: "Pillow Menu", cat: "Bedroom & Laundry" },
{ id: 269, name: "Pillow Top Mattress", cat: "Bedroom & Laundry" },
{ id: 150, name: "Reading Nook", cat: "Bedroom & Laundry" },
{ id: 73, name: "Room Darkening Shades", cat: "Bedroom & Laundry" },
{ id: 268, name: "Standing Valet", cat: "Bedroom & Laundry" },
{ id: 144, name: "Walk in Closet", cat: "Bedroom & Laundry" },
{ id: 33, name: "Washer", cat: "Bedroom & Laundry" },
// Check-in & Services
{ id: 43, name: "24 Hour Check in", cat: "Check-in & Services" },
{ id: 55, name: "Building Staff", cat: "Check-in & Services" },
{ id: 129, name: "Host Greets You", cat: "Check-in & Services" },
{ id: 53, name: "Keypad", cat: "Check-in & Services" },
{ id: 54, name: "Lockbox", cat: "Check-in & Services" },
{ id: 103, name: "Luggage Dropoff Allowed", cat: "Check-in & Services" },
{ id: 106, name: "Pick Up Service", cat: "Check-in & Services" },
{ id: 51, name: "Self Check in", cat: "Check-in & Services" },
{ id: 52, name: "Smart Lock", cat: "Check-in & Services" },
// Climate
{ id: 5, name: "Air Conditioning", cat: "Climate" },
{ id: 138, name: "Air Purifier", cat: "Climate" },
{ id: 139, name: "Ceiling Fan", cat: "Climate" },
{ id: 406, name: "Ceiling Fans", cat: "Climate" },
{ id: 140, name: "Central Air Conditioning", cat: "Climate" },
{ id: 427, name: "Decorative Fireplace", cat: "Climate" },
{ id: 441, name: "Floor Cooling", cat: "Climate" },
{ id: 449, name: "Gas Fireplace", cat: "Climate" },
{ id: 279, name: "Heat Lamps", cat: "Climate" },
{ id: 143, name: "Heated Floor", cat: "Climate" },
{ id: 30, name: "Heating", cat: "Climate" },
{ id: 462, name: "Humidifier", cat: "Climate" },
{ id: 27, name: "Indoor Fireplace", cat: "Climate" },
{ id: 501, name: "Nest Thermometer", cat: "Climate" },
{ id: 142, name: "Portable Air Conditioning", cat: "Climate" },
{ id: 522, name: "Portable Fans", cat: "Climate" },
{ id: 141, name: "Radiant Heating", cat: "Climate" },
{ id: 550, name: "Smart Home Technology", cat: "Climate" },
{ id: 551, name: "Smart Lighting", cat: "Climate" },
{ id: 209, name: "Solar Power", cat: "Climate" },
{ id: 592, name: "Wood Burning Fireplace", cat: "Climate" },
{ id: 594, name: "Wood Burning Stove", cat: "Climate" },
// Entertainment
{ id: 267, name: "Amazon Echo", cat: "Entertainment" },
{ id: 370, name: "Apple TV", cat: "Entertainment" },
{ id: 372, name: "Art Gallery", cat: "Entertainment" },
{ id: 373, name: "Art Studio", cat: "Entertainment" },
{ id: 359, name: "Arts and Crafts", cat: "Entertainment" },
{ id: 188, name: "Bar", cat: "Entertainment" },
{ id: 391, name: "Blu Ray Player", cat: "Entertainment" },
{ id: 390, name: "Bluetooth Speaker", cat: "Entertainment" },
{ id: 392, name: "Board Games", cat: "Entertainment" },
{ id: 394, name: "Books and Reading Material", cat: "Entertainment" },
{ id: 397, name: "Bose Sound System", cat: "Entertainment" },
{ id: 398, name: "Bose Stereo", cat: "Entertainment" },
{ id: 399, name: "Boutique", cat: "Entertainment" },
{ id: 401, name: "Business Center", cat: "Entertainment" },
{ id: 405, name: "CD Player", cat: "Entertainment" },
{ id: 2, name: "Cable TV", cat: "Entertainment" },
{ id: 402, name: "Card Room", cat: "Entertainment" },
{ id: 403, name: "Card Table", cat: "Entertainment" },
{ id: 430, name: "DJ Booth", cat: "Entertainment" },
{ id: 431, name: "DJ Platform", cat: "Entertainment" },
{ id: 432, name: "DJ Turntables", cat: "Entertainment" },
{ id: 152, name: "DVD Player", cat: "Entertainment" },
{ id: 434, name: "DVR", cat: "Entertainment" },
{ id: 424, name: "Dance Floor", cat: "Entertainment" },
{ id: 425, name: "Dance Room", cat: "Entertainment" },
{ id: 426, name: "Darts", cat: "Entertainment" },
{ id: 429, name: "Discotheque", cat: "Entertainment" },
{ id: 333, name: "Entertainment System", cat: "Entertainment" },
{ id: 75, name: "Game Console", cat: "Entertainment" },
{ id: 446, name: "Game Room", cat: "Entertainment" },
{ id: 447, name: "Game Table", cat: "Entertainment" },
{ id: 349, name: "Games", cat: "Entertainment" },
{ id: 348, name: "Guitar", cat: "Entertainment" },
{ id: 266, name: "HBO Go", cat: "Entertainment" },
{ id: 472, name: "Jukebox", cat: "Entertainment" },
{ id: 480, name: "Library", cat: "Entertainment" },
{ id: 357, name: "Lighting", cat: "Entertainment" },
{ id: 496, name: "MP3 Player", cat: "Entertainment" },
{ id: 485, name: "Massage Bale", cat: "Entertainment" },
{ id: 486, name: "Massage Bed", cat: "Entertainment" },
{ id: 487, name: "Massage Chair", cat: "Entertainment" },
{ id: 488, name: "Massage Couch", cat: "Entertainment" },
{ id: 489, name: "Massage Room", cat: "Entertainment" },
{ id: 490, name: "Media Room", cat: "Entertainment" },
{ id: 335, name: "Movie Collection", cat: "Entertainment" },
{ id: 459, name: "Movie Theater", cat: "Entertainment" },
{ id: 499, name: "Music Room", cat: "Entertainment" },
{ id: 334, name: "Music System", cat: "Entertainment" },
{ id: 265, name: "Netflix", cat: "Entertainment" },
{ id: 502, name: "Nightclub", cat: "Entertainment" },
{ id: 503, name: "Nintendo Wii", cat: "Entertainment" },
{ id: 509, name: "Party Lighting", cat: "Entertainment" },
{ id: 336, name: "Phone", cat: "Entertainment" },
{ id: 347, name: "Piano", cat: "Entertainment" },
{ id: 518, name: "Poker Table", cat: "Entertainment" },
{ id: 525, name: "Projector", cat: "Entertainment" },
{ id: 526, name: "Reception Area", cat: "Entertainment" },
{ id: 527, name: "Record Player", cat: "Entertainment" },
{ id: 529, name: "Restaurant", cat: "Entertainment" },
{ id: 541, name: "Satellite Radio", cat: "Entertainment" },
{ id: 542, name: "Satellite TV", cat: "Entertainment" },
{ id: 151, name: "Smart TV", cat: "Entertainment" },
{ id: 356, name: "Smart Technology", cat: "Entertainment" },
{ id: 555, name: "Sonos Sound System", cat: "Entertainment" },
{ id: 185, name: "Sound System", cat: "Entertainment" },
{ id: 560, name: "Sports Bar", cat: "Entertainment" },
{ id: 354, name: "Streaming Services", cat: "Entertainment" },
{ id: 567, name: "Surround Sound System", cat: "Entertainment" },
{ id: 1, name: "TV", cat: "Entertainment" },
{ id: 569, name: "Tablet", cat: "Entertainment" },
{ id: 572, name: "Tivo", cat: "Entertainment" },
{ id: 355, name: "Video Games", cat: "Entertainment" },
{ id: 578, name: "View Tower", cat: "Entertainment" },
{ id: 338, name: "Walkie Talkie", cat: "Entertainment" },
{ id: 596, name: "Xbox", cat: "Entertainment" },
{ id: 467, name: "iPhone Dock", cat: "Entertainment" },
{ id: 468, name: "iPhone Speaker", cat: "Entertainment" },
{ id: 469, name: "iPod Dock", cat: "Entertainment" },
{ id: 470, name: "iPod Speaker", cat: "Entertainment" },
// Family & Kids
{ id: 62, name: "Baby Bath", cat: "Family & Kids" },
{ id: 375, name: "Baby Bath Kit", cat: "Family & Kids" },
{ id: 341, name: "Baby Car Seat", cat: "Family & Kids" },
{ id: 376, name: "Baby Equipment", cat: "Family & Kids" },
{ id: 59, name: "Baby Monitor", cat: "Family & Kids" },
{ id: 340, name: "Baby Pool Safety Fence", cat: "Family & Kids" },
{ id: 339, name: "Baby Safety Gate", cat: "Family & Kids" },
{ id: 65, name: "Baby Safety Gates", cat: "Family & Kids" },
{ id: 342, name: "Baby Stroller", cat: "Family & Kids" },
{ id: 70, name: "Babysitter Recommendations", cat: "Family & Kids" },
{ id: 344, name: "Boat", cat: "Family & Kids" },
{ id: 395, name: "Booster Seat", cat: "Family & Kids" },
{ id: 365, name: "Bottle Warmers", cat: "Family & Kids" },
{ id: 404, name: "Car Seat", cat: "Family & Kids" },
{ id: 63, name: "Changing Table", cat: "Family & Kids" },
{ id: 409, name: "Childproof Bedroom", cat: "Family & Kids" },
{ id: 410, name: "Children\'s Books", cat: "Family & Kids" },
{ id: 66, name: "Children\'s Books and Toys", cat: "Family & Kids" },
{ id: 74, name: "Children\'s Dinnerware", cat: "Family & Kids" },
{ id: 363, name: "Children\'s Playroom", cat: "Family & Kids" },
{ id: 411, name: "Children\'s Toys", cat: "Family & Kids" },
{ id: 71, name: "Crib", cat: "Family & Kids" },
{ id: 31, name: "Family Kid Friendly", cat: "Family & Kids" },
{ id: 69, name: "Fireplace Guards", cat: "Family & Kids" },
{ id: 64, name: "High Chair", cat: "Family & Kids" },
{ id: 345, name: "Jungle Gym", cat: "Family & Kids" },
{ id: 477, name: "Kids Club", cat: "Family & Kids" },
{ id: 361, name: "Kids TV Room", cat: "Family & Kids" },
{ id: 364, name: "Outdoor Playground", cat: "Family & Kids" },
{ id: 60, name: "Outlet Covers", cat: "Family & Kids" },
{ id: 72, name: "Pack \'n Play Travel Crib", cat: "Family & Kids" },
{ id: 362, name: "Playhouse", cat: "Family & Kids" },
{ id: 360, name: "Playpen", cat: "Family & Kids" },
{ id: 343, name: "Seabob", cat: "Family & Kids" },
{ id: 68, name: "Table Corner Guards", cat: "Family & Kids" },
{ id: 67, name: "Window Guards", cat: "Family & Kids" },
// Kitchen & Dining
{ id: 310, name: "Asian Steamer Pots", cat: "Kitchen & Dining" },
{ id: 387, name: "Belgian Wafflemaker", cat: "Kitchen & Dining" },
{ id: 322, name: "Blender", cat: "Kitchen & Dining" },
{ id: 233, name: "Breakfast Bar", cat: "Kitchen & Dining" },
{ id: 234, name: "Breakfast Table", cat: "Kitchen & Dining" },
{ id: 186, name: "Brick Oven", cat: "Kitchen & Dining" },
{ id: 408, name: "Chef\'s Kitchen", cat: "Kitchen & Dining" },
{ id: 415, name: "Coffee", cat: "Kitchen & Dining" },
{ id: 302, name: "Coffee Beans", cat: "Kitchen & Dining" },
{ id: 301, name: "Coffee Grinder", cat: "Kitchen & Dining" },
{ id: 90, name: "Coffee Maker", cat: "Kitchen & Dining" },
{ id: 264, name: "Convection Oven", cat: "Kitchen & Dining" },
{ id: 94, name: "Cooking Basics", cat: "Kitchen & Dining" },
{ id: 317, name: "Cotton Candy Machine", cat: "Kitchen & Dining" },
{ id: 311, name: "Deep Fryer", cat: "Kitchen & Dining" },
{ id: 236, name: "Dining Table", cat: "Kitchen & Dining" },
{ id: 93, name: "Dishes and Silverware", cat: "Kitchen & Dining" },
{ id: 92, name: "Dishwasher", cat: "Kitchen & Dining" },
{ id: 263, name: "Double Oven", cat: "Kitchen & Dining" },
{ id: 312, name: "Dough Maker", cat: "Kitchen & Dining" },
{ id: 307, name: "Dumbwaiter", cat: "Kitchen & Dining" },
{ id: 235, name: "Espresso Machine", cat: "Kitchen & Dining" },
{ id: 313, name: "Food Mixer", cat: "Kitchen & Dining" },
{ id: 314, name: "Food Processor", cat: "Kitchen & Dining" },
{ id: 237, name: "Formal Dining Area", cat: "Kitchen & Dining" },
{ id: 308, name: "Freezer", cat: "Kitchen & Dining" },
{ id: 318, name: "Frozen Yogurt Machine", cat: "Kitchen & Dining" },
{ id: 285, name: "Full Kitchen", cat: "Kitchen & Dining" },
{ id: 448, name: "Gas Burning Stove", cat: "Kitchen & Dining" },
{ id: 450, name: "Gas Grill", cat: "Kitchen & Dining" },
{ id: 187, name: "Gas Oven", cat: "Kitchen & Dining" },
{ id: 332, name: "Grill", cat: "Kitchen & Dining" },
{ id: 137, name: "Hot Water Kettle", cat: "Kitchen & Dining" },
{ id: 329, name: "Ice Cooler", cat: "Kitchen & Dining" },
{ id: 325, name: "Ice Cream Maker", cat: "Kitchen & Dining" },
{ id: 330, name: "Ice Machine", cat: "Kitchen & Dining" },
{ id: 463, name: "Immersion Blender", cat: "Kitchen & Dining" },
{ id: 464, name: "Induction Cooker", cat: "Kitchen & Dining" },
{ id: 320, name: "Juicer", cat: "Kitchen & Dining" },
{ id: 476, name: "Keurig Coffee Machine", cat: "Kitchen & Dining" },
{ id: 8, name: "Kitchen", cat: "Kitchen & Dining" },
{ id: 145, name: "Kitchenette", cat: "Kitchen & Dining" },
{ id: 324, name: "Margarita Machine", cat: "Kitchen & Dining" },
{ id: 89, name: "Microwave", cat: "Kitchen & Dining" },
{ id: 146, name: "Mini Fridge", cat: "Kitchen & Dining" },
{ id: 500, name: "Nespresso Machine", cat: "Kitchen & Dining" },
{ id: 95, name: "Oven", cat: "Kitchen & Dining" },
{ id: 507, name: "Pantry", cat: "Kitchen & Dining" },
{ id: 516, name: "Pizza Oven", cat: "Kitchen & Dining" },
{ id: 316, name: "Popcorn Maker", cat: "Kitchen & Dining" },
{ id: 323, name: "Portable Cooler", cat: "Kitchen & Dining" },
{ id: 331, name: "Pour Over Coffee", cat: "Kitchen & Dining" },
{ id: 524, name: "Pressure Cooker", cat: "Kitchen & Dining" },
{ id: 91, name: "Refrigerator", cat: "Kitchen & Dining" },
{ id: 315, name: "Rice Maker", cat: "Kitchen & Dining" },
{ id: 306, name: "Serving Platters", cat: "Kitchen & Dining" },
{ id: 319, name: "Slow Cooker", cat: "Kitchen & Dining" },
{ id: 321, name: "Sodamaster", cat: "Kitchen & Dining" },
{ id: 561, name: "Staff Kitchen", cat: "Kitchen & Dining" },
{ id: 252, name: "Stainless Steel Appliances", cat: "Kitchen & Dining" },
{ id: 262, name: "Steam Oven", cat: "Kitchen & Dining" },
{ id: 96, name: "Stove", cat: "Kitchen & Dining" },
{ id: 564, name: "Sub Zero Refrigerator", cat: "Kitchen & Dining" },
{ id: 570, name: "Tasting Room", cat: "Kitchen & Dining" },
{ id: 350, name: "Tea", cat: "Kitchen & Dining" },
{ id: 251, name: "Toaster", cat: "Kitchen & Dining" },
{ id: 309, name: "Toaster Oven", cat: "Kitchen & Dining" },
{ id: 277, name: "Touchless Faucets", cat: "Kitchen & Dining" },
{ id: 579, name: "Vitamix Blender", cat: "Kitchen & Dining" },
{ id: 582, name: "Walk in Pantry", cat: "Kitchen & Dining" },
{ id: 276, name: "Warming Drawer", cat: "Kitchen & Dining" },
{ id: 326, name: "Water Cooler", cat: "Kitchen & Dining" },
{ id: 328, name: "Water Filter", cat: "Kitchen & Dining" },
{ id: 327, name: "Water Filtration System", cat: "Kitchen & Dining" },
{ id: 585, name: "Wet Bar", cat: "Kitchen & Dining" },
{ id: 586, name: "Wine Bar", cat: "Kitchen & Dining" },
{ id: 587, name: "Wine Cave", cat: "Kitchen & Dining" },
{ id: 588, name: "Wine Collection", cat: "Kitchen & Dining" },
{ id: 589, name: "Wine Room", cat: "Kitchen & Dining" },
{ id: 590, name: "Wine Storage", cat: "Kitchen & Dining" },
// Location & Property
{ id: 374, name: "Attic", cat: "Location & Property" },
{ id: 155, name: "Beach View", cat: "Location & Property" },
{ id: 134, name: "Beachfront", cat: "Location & Property" },
{ id: 191, name: "Gated Community", cat: "Location & Property" },
{ id: 190, name: "Gated Property", cat: "Location & Property" },
{ id: 195, name: "Greenhouse", cat: "Location & Property" },
{ id: 194, name: "Grotto", cat: "Location & Property" },
{ id: 454, name: "Guesthouse", cat: "Location & Property" },
{ id: 192, name: "Helipad", cat: "Location & Property" },
{ id: 133, name: "Lake Access", cat: "Location & Property" },
{ id: 154, name: "Mountain View", cat: "Location & Property" },
{ id: 284, name: "Mudroom", cat: "Location & Property" },
{ id: 131, name: "Other", cat: "Location & Property" },
{ id: 532, name: "Rooftop", cat: "Location & Property" },
{ id: 98, name: "Single Level Home", cat: "Location & Property" },
{ id: 135, name: "Ski in Ski Out", cat: "Location & Property" },
{ id: 549, name: "Sliding Glass Walls", cat: "Location & Property" },
{ id: 193, name: "Stables", cat: "Location & Property" },
{ id: 132, name: "Waterfront", cat: "Location & Property" },
// Other
{ id: 378, name: "Badminton Field", cat: "Other" },
{ id: 379, name: "Banquet Hall", cat: "Other" },
{ id: 28, name: "Buzzer Wireless Intercom", cat: "Other" },
{ id: 407, name: "Champagne Bar", cat: "Other" },
{ id: 215, name: "Chapel", cat: "Other" },
{ id: 217, name: "Charcoal Barbeque", cat: "Other" },
{ id: 412, name: "Cigar Room", cat: "Other" },
{ id: 351, name: "Clothing Steamer", cat: "Other" },
{ id: 421, name: "Cradle", cat: "Other" },
{ id: 423, name: "Cross Trainer", cat: "Other" },
{ id: 300, name: "Daily Newspaper", cat: "Other" },
{ id: 428, name: "Dining Area", cat: "Other" },
{ id: 14, name: "Doorman", cat: "Other" },
{ id: 435, name: "Electric Blinds", cat: "Other" },
{ id: 40, name: "Essentials", cat: "Other" },
{ id: 272, name: "Fax Machine", cat: "Other" },
{ id: 440, name: "Flattop Grill", cat: "Other" },
{ id: 220, name: "Generator", cat: "Other" },
{ id: 455, name: "Hair Salon", cat: "Other" },
{ id: 456, name: "Heated Boot Rack", cat: "Other" },
{ id: 461, name: "Hospital", cat: "Other" },
{ id: 353, name: "Kitchen Appliances", cat: "Other" },
{ id: 481, name: "Lookout Point", cat: "Other" },
{ id: 483, name: "Luggage Storage", cat: "Other" },
{ id: 492, name: "Minibar", cat: "Other" },
{ id: 216, name: "Natural Gas Barbeque", cat: "Other" },
{ id: 238, name: "Olympic Size Pool", cat: "Other" },
{ id: 179, name: "Outdoor Dining Area", cat: "Other" },
{ id: 57, name: "Private Entrance", cat: "Other" },
{ id: 56, name: "Private Living Room", cat: "Other" },
{ id: 189, name: "Projector and Screen", cat: "Other" },
{ id: 218, name: "Propane Barbeque", cat: "Other" },
{ id: 528, name: "Resort Access", cat: "Other" },
{ id: 546, name: "Ski Locker", cat: "Other" },
{ id: 547, name: "Ski Rack", cat: "Other" },
{ id: 548, name: "Ski Room", cat: "Other" },
{ id: 552, name: "Smoking Parlor", cat: "Other" },
{ id: 554, name: "Solarium", cat: "Other" },
{ id: 559, name: "Speed Boat", cat: "Other" },
{ id: 563, name: "Stroller", cat: "Other" },
{ id: 239, name: "Swimming Pool", cat: "Other" },
{ id: 571, name: "Tennis Club", cat: "Other" },
{ id: 228, name: "Wine Cellar", cat: "Other" },
{ id: 274, name: "Wine Cooler", cat: "Other" },
{ id: 591, name: "Wireless Intercom", cat: "Other" },
{ id: 593, name: "Wood Burning Oven", cat: "Other" },
// Outdoor & Nature
{ id: 99, name: "BBQ Grill", cat: "Outdoor & Nature" },
{ id: 101, name: "Backyard", cat: "Outdoor & Nature" },
{ id: 181, name: "Balcony", cat: "Outdoor & Nature" },
{ id: 381, name: "Beach", cat: "Outdoor & Nature" },
{ id: 382, name: "Beach Bar", cat: "Outdoor & Nature" },
{ id: 176, name: "Beach Chairs", cat: "Outdoor & Nature" },
{ id: 383, name: "Beach Club", cat: "Outdoor & Nature" },
{ id: 102, name: "Beach Essentials", cat: "Outdoor & Nature" },
{ id: 384, name: "Beach House", cat: "Outdoor & Nature" },
{ id: 385, name: "Beach Towels", cat: "Outdoor & Nature" },
{ id: 386, name: "Beach Umbrella", cat: "Outdoor & Nature" },
{ id: 196, name: "Beach Volleyball", cat: "Outdoor & Nature" },
{ id: 388, name: "Bike Storage", cat: "Outdoor & Nature" },
{ id: 389, name: "Binoculars", cat: "Outdoor & Nature" },
{ id: 177, name: "Boogie Boards", cat: "Outdoor & Nature" },
{ id: 173, name: "Canoe", cat: "Outdoor & Nature" },
{ id: 204, name: "Climbing Wall", cat: "Outdoor & Nature" },
{ id: 420, name: "Courtyard", cat: "Outdoor & Nature" },
{ id: 422, name: "Creek", cat: "Outdoor & Nature" },
{ id: 433, name: "Dock", cat: "Outdoor & Nature" },
{ id: 219, name: "Fire Pit", cat: "Outdoor & Nature" },
{ id: 439, name: "Fishing Boat", cat: "Outdoor & Nature" },
{ id: 207, name: "Fountain", cat: "Outdoor & Nature" },
{ id: 255, name: "Garden", cat: "Outdoor & Nature" },
{ id: 183, name: "Gazebo", cat: "Outdoor & Nature" },
{ id: 153, name: "Hammock", cat: "Outdoor & Nature" },
{ id: 171, name: "Jet Skis", cat: "Outdoor & Nature" },
{ id: 473, name: "Juliet Balcony", cat: "Outdoor & Nature" },
{ id: 172, name: "Kayak", cat: "Outdoor & Nature" },
{ id: 475, name: "Kayaks", cat: "Outdoor & Nature" },
{ id: 478, name: "Lanai", cat: "Outdoor & Nature" },
{ id: 482, name: "Lounge Chairs", cat: "Outdoor & Nature" },
{ id: 203, name: "Misting System", cat: "Outdoor & Nature" },
{ id: 494, name: "Mosquito Misting System", cat: "Outdoor & Nature" },
{ id: 211, name: "Mosquito Net", cat: "Outdoor & Nature" },
{ id: 495, name: "Mosquito Trap", cat: "Outdoor & Nature" },
{ id: 504, name: "Outdoor Adapter", cat: "Outdoor & Nature" },
{ id: 280, name: "Outdoor Furniture", cat: "Outdoor & Nature" },
{ id: 184, name: "Outdoor Kitchen", cat: "Outdoor & Nature" },
{ id: 505, name: "Paddle Boats", cat: "Outdoor & Nature" },
{ id: 506, name: "Palapa", cat: "Outdoor & Nature" },
{ id: 508, name: "Parasols", cat: "Outdoor & Nature" },
{ id: 510, name: "Patio", cat: "Outdoor & Nature" },
{ id: 100, name: "Patio or Balcony", cat: "Outdoor & Nature" },
{ id: 182, name: "Pergola", cat: "Outdoor & Nature" },
{ id: 208, name: "Pond", cat: "Outdoor & Nature" },
{ id: 531, name: "Rocking Chair", cat: "Outdoor & Nature" },
{ id: 169, name: "Sailboat", cat: "Outdoor & Nature" },
{ id: 540, name: "Sandbox", cat: "Outdoor & Nature" },
{ id: 178, name: "Snorkeling Equipment", cat: "Outdoor & Nature" },
{ id: 175, name: "Stand Up Paddle Board", cat: "Outdoor & Nature" },
{ id: 565, name: "Sun Bed", cat: "Outdoor & Nature" },
{ id: 566, name: "Sun Deck", cat: "Outdoor & Nature" },
{ id: 174, name: "Surfboard", cat: "Outdoor & Nature" },
{ id: 568, name: "Swings", cat: "Outdoor & Nature" },
{ id: 180, name: "Terrace", cat: "Outdoor & Nature" },
{ id: 573, name: "Trail Access", cat: "Outdoor & Nature" },
{ id: 575, name: "Trellised Courtyard", cat: "Outdoor & Nature" },
{ id: 577, name: "Veranda", cat: "Outdoor & Nature" },
{ id: 583, name: "Water Skis", cat: "Outdoor & Nature" },
{ id: 170, name: "Windsurfers", cat: "Outdoor & Nature" },
{ id: 598, name: "Zip Line", cat: "Outdoor & Nature" },
// Parking & Access
{ id: 599, name: "Covered Parking", cat: "Parking & Access" },
{ id: 212, name: "Driveway Parking", cat: "Parking & Access" },
{ id: 97, name: "EV Charger", cat: "Parking & Access" },
{ id: 21, name: "Elevator", cat: "Parking & Access" },
{ id: 9, name: "Free Parking on Premises", cat: "Parking & Access" },
{ id: 23, name: "Free Street Parking", cat: "Parking & Access" },
{ id: 22, name: "Garage Parking", cat: "Parking & Access" },
{ id: 282, name: "Outdoor Parking", cat: "Parking & Access" },
{ id: 10, name: "Paid Parking Off Premises", cat: "Parking & Access" },
{ id: 287, name: "Paid Parking on Premises", cat: "Parking & Access" },
{ id: 24, name: "Permit Parking", cat: "Parking & Access" },
{ id: 213, name: "Underground Parking", cat: "Parking & Access" },
// Pets
{ id: 19, name: "Cat s", cat: "Pets" },
{ id: 18, name: "Dog s", cat: "Pets" },
{ id: 20, name: "Other Pet s", cat: "Pets" },
{ id: 12, name: "Pets Allowed", cat: "Pets" },
{ id: 17, name: "Pets Live on This Property", cat: "Pets" },
// Policies & Services
{ id: 16, name: "Breakfast", cat: "Policies & Services" },
{ id: 107, name: "Cleaning Available During Stay", cat: "Policies & Services" },
{ id: 104, name: "Long Term Stays Allowed", cat: "Policies & Services" },
{ id: 11, name: "Smoking Allowed", cat: "Policies & Services" },
{ id: 48, name: "Sonoma Select", cat: "Policies & Services" },
{ id: 32, name: "Suitable for Events", cat: "Policies & Services" },
// Pool & Water
{ id: 243, name: "Childrens Pool", cat: "Pool & Water" },
{ id: 249, name: "Day Bed", cat: "Pool & Water" },
{ id: 458, name: "Heated Infinity Pool", cat: "Pool & Water" },
{ id: 254, name: "Heated Pool", cat: "Pool & Water" },
{ id: 25, name: "Hot Tub", cat: "Pool & Water" },
{ id: 240, name: "Infinity Pool", cat: "Pool & Water" },
{ id: 26, name: "Jacuzzi Tub", cat: "Pool & Water" },
{ id: 242, name: "Lap Pool", cat: "Pool & Water" },
{ id: 498, name: "Multi Level Pool", cat: "Pool & Water" },
{ id: 241, name: "Plunge Pool", cat: "Pool & Water" },
{ id: 519, name: "Pool Bar", cat: "Pool & Water" },
{ id: 278, name: "Pool Cover", cat: "Pool & Water" },
{ id: 244, name: "Pool House", cat: "Pool & Water" },
{ id: 250, name: "Pool Toys", cat: "Pool & Water" },
{ id: 246, name: "Pool Waterfall", cat: "Pool & Water" },
{ id: 245, name: "Pool Waterslide", cat: "Pool & Water" },
{ id: 260, name: "Private Hot Tub", cat: "Pool & Water" },
{ id: 7, name: "Private Pool", cat: "Pool & Water" },
{ id: 537, name: "Saltwater Hot Tub", cat: "Pool & Water" },
{ id: 538, name: "Saltwater Infinity Pool", cat: "Pool & Water" },
{ id: 539, name: "Saltwater Pool", cat: "Pool & Water" },
{ id: 261, name: "Shared Hot Tub", cat: "Pool & Water" },
{ id: 259, name: "Shared Pool", cat: "Pool & Water" },
{ id: 248, name: "Sun Loungers", cat: "Pool & Water" },
{ id: 247, name: "Swim Up Bar", cat: "Pool & Water" },
{ id: 584, name: "Wave Pool", cat: "Pool & Water" },
// Safety & Security
{ id: 231, name: "Alarm System", cat: "Safety & Security" },
{ id: 36, name: "Carbon Monoxide Alarm", cat: "Safety & Security" },
{ id: 39, name: "Fire Extinguisher", cat: "Safety & Security" },
{ id: 37, name: "First Aid Kit", cat: "Safety & Security" },
{ id: 520, name: "Pool Safety Fence", cat: "Safety & Security" },
{ id: 232, name: "Safe", cat: "Safety & Security" },
{ id: 536, name: "Safe Room", cat: "Safety & Security" },
{ id: 38, name: "Safety Card", cat: "Safety & Security" },
{ id: 534, name: "Safety Deposit Box", cat: "Safety & Security" },
{ id: 535, name: "Safety Gate", cat: "Safety & Security" },
{ id: 229, name: "Security Cameras", cat: "Safety & Security" },
{ id: 9999, name: "Security Cameras on Property", cat: "Safety & Security" },
{ id: 230, name: "Security Monitors", cat: "Safety & Security" },
{ id: 544, name: "Security System", cat: "Safety & Security" },
{ id: 35, name: "Smoke Alarm", cat: "Safety & Security" },
// Sports & Fitness
{ id: 200, name: "ATV", cat: "Sports & Fitness" },
{ id: 369, name: "Air Hockey Table", cat: "Sports & Fitness" },
{ id: 371, name: "Arcade Games", cat: "Sports & Fitness" },
{ id: 377, name: "Backgammon", cat: "Sports & Fitness" },
{ id: 205, name: "Badminton", cat: "Sports & Fitness" },
{ id: 201, name: "Bikes", cat: "Sports & Fitness" },
{ id: 393, name: "Bocce Ball Court", cat: "Sports & Fitness" },
{ id: 396, name: "Boot Dryers", cat: "Sports & Fitness" },
{ id: 400, name: "Boxing Ring", cat: "Sports & Fitness" },
{ id: 206, name: "Croquet", cat: "Sports & Fitness" },
{ id: 436, name: "Exercise Balls", cat: "Sports & Fitness" },
{ id: 437, name: "Exercise Bike", cat: "Sports & Fitness" },
{ id: 227, name: "Exercise Equipment", cat: "Sports & Fitness" },
{ id: 438, name: "Exercise Mat", cat: "Sports & Fitness" },
{ id: 442, name: "Foosball Table", cat: "Sports & Fitness" },
{ id: 443, name: "Formula 1 Simulator", cat: "Sports & Fitness" },
{ id: 444, name: "Free Weights", cat: "Sports & Fitness" },
{ id: 368, name: "Golf", cat: "Sports & Fitness" },
{ id: 198, name: "Golf Cart", cat: "Sports & Fitness" },
{ id: 451, name: "Golf Course Access", cat: "Sports & Fitness" },
{ id: 197, name: "Golf Simulator", cat: "Sports & Fitness" },
{ id: 453, name: "Grass Tennis Court", cat: "Sports & Fitness" },
{ id: 15, name: "Gym", cat: "Sports & Fitness" },
{ id: 460, name: "Horseshoes", cat: "Sports & Fitness" },
{ id: 367, name: "Indoor Pool", cat: "Sports & Fitness" },
{ id: 471, name: "Jogging Track", cat: "Sports & Fitness" },
{ id: 474, name: "Karaoke Machine", cat: "Sports & Fitness" },
{ id: 484, name: "Mahjong Table", cat: "Sports & Fitness" },
{ id: 511, name: "Petanque Court", cat: "Sports & Fitness" },
{ id: 512, name: "Pilates Room", cat: "Sports & Fitness" },
{ id: 514, name: "Pinball Machine", cat: "Sports & Fitness" },
{ id: 515, name: "Ping Pong Table", cat: "Sports & Fitness" },
{ id: 517, name: "Playstation", cat: "Sports & Fitness" },
{ id: 521, name: "Pool Table", cat: "Sports & Fitness" },
{ id: 256, name: "Private Gym", cat: "Sports & Fitness" },
{ id: 202, name: "Putting Green", cat: "Sports & Fitness" },
{ id: 530, name: "Riding Arena", cat: "Sports & Fitness" },
{ id: 533, name: "Rowing Machine", cat: "Sports & Fitness" },
{ id: 257, name: "Shared Gym", cat: "Sports & Fitness" },
{ id: 545, name: "Shuffleboard", cat: "Sports & Fitness" },
{ id: 553, name: "Snooker Table", cat: "Sports & Fitness" },
{ id: 346, name: "Telescope", cat: "Sports & Fitness" },
{ id: 214, name: "Tennis Court", cat: "Sports & Fitness" },
{ id: 574, name: "Treadmill", cat: "Sports & Fitness" },
{ id: 199, name: "UTV", cat: "Sports & Fitness" },
{ id: 581, name: "Volleyball Court", cat: "Sports & Fitness" },
{ id: 595, name: "Workout Bench", cat: "Sports & Fitness" },
{ id: 597, name: "Yoga Studio", cat: "Sports & Fitness" },
// Wellness & Spa
{ id: 225, name: "Hammam", cat: "Wellness & Spa" },
{ id: 465, name: "Infrared Sauna", cat: "Wellness & Spa" },
{ id: 226, name: "Massage Table", cat: "Wellness & Spa" },
{ id: 491, name: "Meditation Room", cat: "Wellness & Spa" },
{ id: 223, name: "Sauna", cat: "Wellness & Spa" },
{ id: 556, name: "Spa", cat: "Wellness & Spa" },
{ id: 557, name: "Spa Access", cat: "Wellness & Spa" },
{ id: 352, name: "Spa Equipment", cat: "Wellness & Spa" },
{ id: 558, name: "Spa Room", cat: "Wellness & Spa" },
{ id: 562, name: "Steam Bath", cat: "Wellness & Spa" },
{ id: 224, name: "Steam Room", cat: "Wellness & Spa" },
{ id: 576, name: "Turkish Bath", cat: "Wellness & Spa" },
// Work & Connectivity
{ id: 337, name: "Cell Reception", cat: "Work & Connectivity" },
{ id: 221, name: "Computer", cat: "Work & Connectivity" },
{ id: 416, name: "Conference Center", cat: "Work & Connectivity" },
{ id: 417, name: "Conference Room", cat: "Work & Connectivity" },
{ id: 418, name: "Copier", cat: "Work & Connectivity" },
{ id: 419, name: "Cordless Phone", cat: "Work & Connectivity" },
{ id: 47, name: "Dedicated Workspace", cat: "Work & Connectivity" },
{ id: 358, name: "Device Chargers", cat: "Work & Connectivity" },
{ id: 87, name: "Ethernet Connection", cat: "Work & Connectivity" },
{ id: 452, name: "Google Home", cat: "Work & Connectivity" },
{ id: 271, name: "High Resolution Computer Monitor", cat: "Work & Connectivity" },
{ id: 3, name: "Internet", cat: "Work & Connectivity" },
{ id: 479, name: "Laptop", cat: "Work & Connectivity" },
{ id: 493, name: "Monitor", cat: "Work & Connectivity" },
{ id: 88, name: "Pocket Wifi", cat: "Work & Connectivity" },
{ id: 222, name: "Printer", cat: "Work & Connectivity" },
{ id: 543, name: "Scanner", cat: "Work & Connectivity" },
{ id: 580, name: "VoIP Phone", cat: "Work & Connectivity" },
{ id: 4, name: "Wifi", cat: "Work & Connectivity" },
{ id: 466, name: "iPad", cat: "Work & Connectivity" },
];

// Total: 585 amenities

const CATEGORIES = [...new Set(AMENITIES.map(a => a.cat))];
const ROOM_TYPES = [
{ value: "Entire%20home%2Fapt", label: "Entire place" },
{ value: "Private%20room", label: "Private room" },
{ value: "Shared%20room", label: "Shared room" },
];
const PROPERTY_TYPES = [
{ value: "1", label: "House" },
{ value: "2", label: "Guest House" },
{ value: "3", label: "Apartment" },
{ value: "4", label: "Hotel" },
];
const VISIBLE_IDS = new Set([1,4,5,7,8,9,12,25,30,33,34,47,51]);

export default function AirbnbUrlBuilder() {
const [location, setLocation] = useState("");
const [checkin, setCheckin] = useState("");
const [checkout, setCheckout] = useState("");
const [adults, setAdults] = useState(1);
const [children, setChildren] = useState(0);
const [infants, setInfants] = useState(0);
const [pets, setPets] = useState(0);
const [roomTypes, setRoomTypes] = useState([]);
const [propertyTypes, setPropertyTypes] = useState([]);
const [priceMin, setPriceMin] = useState("");
const [priceMax, setPriceMax] = useState("");
const [minBedrooms, setMinBedrooms] = useState("");
const [minBeds, setMinBeds] = useState("");
const [minBathrooms, setMinBathrooms] = useState("");
const [superhost, setSuperhost] = useState(false);
const [selectedAmenities, setSelectedAmenities] = useState(new Set());
const [amenitySearch, setAmenitySearch] = useState("");
const [copied, setCopied] = useState(false);
const [expandedCats, setExpandedCats] = useState(new Set());
const [customCodes, setCustomCodes] = useState("");
const [categoryTags, setCategoryTags] = useState("");
const urlRef = useRef(null);

const toggleAmenity = (id) => {
setSelectedAmenities(prev => {
const next = new Set(prev);
next.has(id) ? next.delete(id) : next.add(id);
return next;
});
};
const toggleSet = (value, current, setter) => {
setter(current.includes(value) ? current.filter(v => v !== value) : [...current, value]);
};
const toggleCategory = (cat) => {
setExpandedCats(prev => {
const next = new Set(prev);
next.has(cat) ? next.delete(cat) : next.add(cat);
return next;
});
};

const filteredAmenities = useMemo(() => {
if (!amenitySearch.trim()) return AMENITIES;
const q = amenitySearch.toLowerCase();
return AMENITIES.filter(a =>
a.name.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q) || String(a.id).includes(q)
);
}, [amenitySearch]);

const filteredCategories = useMemo(() => {
const cats = [...new Set(filteredAmenities.map(a => a.cat))];
return CATEGORIES.filter(c => cats.includes(c));
}, [filteredAmenities]);

// Auto-expand categories when searching
const effectiveCats = amenitySearch.trim() ? new Set(CATEGORIES) : expandedCats;

const parsedCustomCodes = useMemo(() => {
if (!customCodes.trim()) return [];
return customCodes.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n > 0);
}, [customCodes]);

const parsedCategoryTags = useMemo(() => {
if (!categoryTags.trim()) return [];
return categoryTags.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n > 0);
}, [categoryTags]);

const generatedUrl = useMemo(() => {
if (!location.trim()) return null;
const loc = location.trim().replace(/\s+/g, "-");
const p = [];
if (checkin) p.push(`checkin=${checkin}`);
if (checkout) p.push(`checkout=${checkout}`);
if (adults > 0) p.push(`adults=${adults}`);
if (children > 0) p.push(`children=${children}`);
if (infants > 0) p.push(`infants=${infants}`);
if (pets > 0) p.push(`pets=${pets}`);
roomTypes.forEach(rt => p.push(`room_types%5B%5D=${rt}`));
if (minBedrooms) p.push(`min_bedrooms=${minBedrooms}`);
if (minBeds) p.push(`min_beds=${minBeds}`);
if (minBathrooms) p.push(`min_bathrooms=${minBathrooms}`);
propertyTypes.forEach(pt => p.push(`l2_property_type_ids%5B%5D=${pt}`));
const allCodes = new Set([...selectedAmenities, ...parsedCustomCodes]);
allCodes.forEach(id => p.push(`amenities%5B%5D=${id}`));
if (superhost) p.push("superhost=true");
parsedCategoryTags.forEach(id => p.push(`kg_and_tags%5B%5D=Tag%3A${id}`));
if (priceMin) p.push(`price_min=${priceMin}`);
if (priceMax) p.push(`price_max=${priceMax}`);
const base = `https://www.airbnb.com/s/${encodeURIComponent(loc)}/homes`;
return p.length > 0 ? `${base}?${p.join("&")}` : base;
}, [location, checkin, checkout, adults, children, infants, pets, roomTypes, propertyTypes, priceMin, priceMax, minBedrooms, minBeds, minBathrooms, selectedAmenities, superhost, parsedCustomCodes, parsedCategoryTags]);

const copyUrl = async () => {
if (!generatedUrl) return;
try { await navigator.clipboard.writeText(generatedUrl); }
catch { urlRef.current?.select(); document.execCommand("copy"); }
setCopied(true);
setTimeout(() => setCopied(false), 2000);
};

const totalSelected = selectedAmenities.size + parsedCustomCodes.length;
const hiddenCount = [...selectedAmenities].filter(id => !VISIBLE_IDS.has(id)).length + parsedCustomCodes.length;

return (
<div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
maxWidth: 720, margin: "0 auto", padding: "24px 16px 120px 16px", color: "#222" }}>

<div style={{ marginBottom: 28 }}>
<h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px 0", letterSpacing: "-0.3px" }}>
Airbnb Advanced Search Builder
</h1>
<p style={{ fontSize: 13, color: "#717171", margin: 0, lineHeight: 1.5 }}>
{AMENITIES.length} amenity codes, plus property types, superhost, and other params Airbnb doesn't fully expose.
</p>
</div>

<Section title="Location">
<input type="text" placeholder="e.g. Catskills--New-York or United-States"
value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
<p style={hintStyle}>Match the format Airbnb uses in its URLs. Dashes for spaces, double dashes for commas.</p>
</Section>

<Section title="Dates">
<div style={{ display: "flex", gap: 12 }}>
<Labeled label="Check-in"><input type="date" value={checkin} onChange={e => setCheckin(e.target.value)} style={inputStyle} /></Labeled>
<Labeled label="Check-out"><input type="date" value={checkout} onChange={e => setCheckout(e.target.value)} style={inputStyle} /></Labeled>
</div>
</Section>

<Section title="Guests">
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
{[["Adults",adults,setAdults,16],["Children",children,setChildren,16],["Infants",infants,setInfants,5],["Pets",pets,setPets,5]].map(([l,v,s,m])=>(
<Labeled key={l} label={l}><input type="number" min={0} max={m} value={v} onChange={e=>s(+e.target.value)} style={inputStyle}/></Labeled>
))}
</div>
</Section>

<Section title="Room type">
<ChipRow items={ROOM_TYPES} selected={roomTypes} toggle={v => toggleSet(v, roomTypes, setRoomTypes)} />
</Section>

<Section title="Property type">
<ChipRow items={PROPERTY_TYPES} selected={propertyTypes} toggle={v => toggleSet(v, propertyTypes, setPropertyTypes)} />
<p style={hintStyle}>l2_property_type_ids: 1=House, 2=Guest House, 3=Apartment, 4=Hotel</p>
</Section>

<Section title="Price & rooms">
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
<Labeled label="Min $/night"><input type="number" min={0} placeholder="$" value={priceMin} onChange={e=>setPriceMin(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Max $/night"><input type="number" min={0} placeholder="$" value={priceMax} onChange={e=>setPriceMax(e.target.value)} style={inputStyle}/></Labeled>
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
<Labeled label="Min bedrooms"><input type="number" min={0} max={16} value={minBedrooms} onChange={e=>setMinBedrooms(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Min beds"><input type="number" min={0} max={16} value={minBeds} onChange={e=>setMinBeds(e.target.value)} style={inputStyle}/></Labeled>
<Labeled label="Min bathrooms"><input type="number" min={0} max={16} value={minBathrooms} onChange={e=>setMinBathrooms(e.target.value)} style={inputStyle}/></Labeled>
</div>
</Section>

<Section title="Host">
<label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14 }}>
<input type="checkbox" checked={superhost} onChange={e=>setSuperhost(e.target.checked)}
style={{ width:18, height:18, accentColor:"#FF5A5F", cursor:"pointer" }} />
Superhosts only
</label>
</Section>

<Section title="Category tags">
<p style={{fontSize:12,color:"#717171",margin:"0 0 10px 0"}}>
Airbnb's knowledge graph categories (removed from UI in April 2025, but the URL parameter <code style={{fontSize:11,background:"#f0f0f0",padding:"1px 4px",borderRadius:3}}>kg_and_tags[]=Tag:ID</code> still works). Only confirmed ID so far: 8175 = Farms.
</p>
<input type="text" placeholder="Enter tag IDs separated by commas, e.g. 8175"
value={categoryTags} onChange={e => setCategoryTags(e.target.value)} style={inputStyle} />
<details style={{marginTop:8}}>
<summary style={{fontSize:12,color:"#717171",cursor:"pointer",userSelect:"none"}}>Known category names (IDs not yet mapped)</summary>
<p style={{fontSize:11,color:"#999",margin:"6px 0 0 0",lineHeight:1.8}}>
Lakefront, National Parks, Chalets, Islands, Beach, Tiny Homes, OMG!, Camping, A-Frames, Design, Arctic, Amazing Pools, Treehouses, Surfing, Bed & Breakfasts, Caves, Tropical, Countryside, Earth Homes, Shared Homes, Luxe, <strong>Farms (8175)</strong>, Amazing Views, Castles, Skiing, Historical Homes, Mansions, Golfing, Cycladic Homes, Barns, Iconic Cities, Chef's Kitchens, Domes, Campers, Shepherd's Huts, Boats, Vineyards, Casas Particulares, Windmills, Kezhans, Houseboats, Minsus, Beachfront, Ryokans, Ski-in/out, Towers, Yurts, Desert, Off-the-grid, Containers, Grand Pianos, Creative Spaces, Trulli, Riads, Dammusos, Lake
</p>
</details>
</Section>

<Section title={<span>Amenity filters{totalSelected > 0 && <span style={{fontWeight:400,fontSize:13,color:"#717171",marginLeft:8}}>{totalSelected} selected{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}</span>}</span>}>
<p style={{fontSize:12,color:"#717171",margin:"0 0 10px 0"}}><strong>All</strong> selected filters must be present on a listing for it to appear in results.</p>
<div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
<input type="text" placeholder="Search amenities or enter a code..."
value={amenitySearch} onChange={e => setAmenitySearch(e.target.value)}
style={{ ...inputStyle, flex:1, marginBottom:0 }} />
{selectedAmenities.size > 0 && (
<button onClick={()=>{setSelectedAmenities(new Set());setAmenitySearch("");}}
style={{background:"none",border:"none",color:"#FF5A5F",fontSize:13,cursor:"pointer",whiteSpace:"nowrap",padding:"4px 0"}}>
Clear
</button>
)}
</div>

<div style={{ maxHeight:440, overflowY:"auto", border:"1px solid #e8e8e8", borderRadius:8, background:"#fafafa" }}>
{filteredCategories.map(cat => {
const items = filteredAmenities.filter(a => a.cat === cat);
const open = effectiveCats.has(cat);
const sel = items.filter(a => selectedAmenities.has(a.id)).length;
return (
<div key={cat}>
<button onClick={() => toggleCategory(cat)} style={{
display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",
padding:"10px 14px",background:"none",border:"none",borderBottom:"1px solid #eee",
cursor:"pointer",fontSize:13,fontWeight:600,color:"#222",textAlign:"left"}}>
<span>{open?"▾":"▸"} {cat}
{sel > 0 && <span style={{background:"#FF5A5F",color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:600,marginLeft:8}}>{sel}</span>}
</span>
<span style={{fontSize:12,color:"#999",fontWeight:400}}>{items.length}</span>
</button>
{open && (
<div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"10px 14px",borderBottom:"1px solid #eee"}}>
{items.map(a => {
const on = selectedAmenities.has(a.id);
const hidden = !VISIBLE_IDS.has(a.id);
return (
<button key={a.id} onClick={() => toggleAmenity(a.id)}
title={`amenities[]=${a.id}${hidden ? " (hidden)" : " (in UI)"}`}
style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${on?"#222":"#ddd"}`,
background:on?"#222":"#fff",color:on?"#fff":"#484848",cursor:"pointer",
fontSize:12,fontWeight:500,transition:"all 0.15s",lineHeight:1.3,
display:"inline-flex",alignItems:"center",gap:4}}>
{hidden && !on && <span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:"#FF5A5F",flexShrink:0}}/>}
{a.name}
<span style={{fontSize:10,opacity:on?0.7:0.4}}>{a.id}</span>
</button>
);
})}
</div>
)}
</div>
);
})}
</div>

<div style={{marginTop:12}}>
<label style={labelStyle}>Custom amenity codes</label>
<input type="text" placeholder="Enter additional codes separated by commas"
value={customCodes} onChange={e => setCustomCodes(e.target.value)} style={inputStyle} />
<p style={hintStyle}>
<span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:"#FF5A5F",marginRight:4,verticalAlign:"middle"}}/>
= hidden filter. Hover chips for the URL param.
</p>
</div>
</Section>

<div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderTop:"2px solid #e8e8e8",padding:"12px 16px",zIndex:100,boxShadow:"0 -2px 12px rgba(0,0,0,0.06)"}}>
<div style={{maxWidth:720,margin:"0 auto"}}>
{generatedUrl ? (
<div style={{display:"flex",gap:8}}>
<input ref={urlRef} type="text" value={generatedUrl} readOnly onClick={e=>e.target.select()}
style={{...inputStyle,flex:1,marginBottom:0,fontSize:12,fontFamily:"'SF Mono',Menlo,Monaco,monospace",background:"#f7f7f7"}}/>
<button onClick={copyUrl} style={{background:copied?"#222":"#FF5A5F",color:"#fff",border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"background 0.2s",minWidth:72}}>
{copied?"Copied":"Copy"}
</button>
<a href={generatedUrl} target="_blank" rel="noopener noreferrer"
style={{display:"flex",alignItems:"center",background:"#222",color:"#fff",border:"none",borderRadius:8,padding:"0 18px",fontSize:13,fontWeight:600,cursor:"pointer",textDecoration:"none",whiteSpace:"nowrap"}}>
Open
</a>
</div>
) : (
<div style={{padding:"10px 14px",background:"#f7f7f7",borderRadius:8,color:"#999",fontSize:13,textAlign:"center"}}>
Enter a location above to generate the search URL.
</div>
)}
</div>
</div>
</div>
);
}

function Section({title,children}) {
return <div style={{marginBottom:20}}><h2 style={{fontSize:14,fontWeight:600,color:"#222",margin:"0 0 10px 0"}}>{title}</h2>{children}</div>;
}
function Labeled({label,children}) {
return <div style={{flex:1}}><label style={labelStyle}>{label}</label>{children}</div>;
}
function ChipRow({items,selected,toggle}) {
return <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{items.map(i=><button key={i.value} onClick={()=>toggle(i.value)} style={{
padding:"6px 14px",borderRadius:20,border:`1px solid ${selected.includes(i.value)?"#222":"#ddd"}`,
background:selected.includes(i.value)?"#222":"#fff",color:selected.includes(i.value)?"#fff":"#222",
cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.15s",lineHeight:1.3
}}>{i.label}</button>)}
</div>;
}

const inputStyle = {width:"100%",padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:14,color:"#222",background:"#fff",outline:"none",boxSizing:"border-box"};
const labelStyle = {display:"block",fontSize:12,fontWeight:500,color:"#717171",marginBottom:4};
const hintStyle = {fontSize:12,color:"#999",margin:"6px 0 0 0",lineHeight:1.4};
