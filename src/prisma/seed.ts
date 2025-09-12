import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const seed = async () => {
  try {
    await prisma.$transaction([
      prisma.item.deleteMany({}),
      prisma.item.createMany({
        data: [
          { name: "Sword of Light", type: "weapon", rarity: "epic", levelRequired: 5, attackPower: 50, defensePower: 0, price: 1000 },
          { name: "Iron Sword", type: "weapon", rarity: "common", levelRequired: 1, attackPower: 10, defensePower: 0, price: 100 },
          { name: "Dragon Slayer", type: "weapon", rarity: "legendary", levelRequired: 10, attackPower: 120, defensePower: 0, price: 5000 },
          { name: "Steel Dagger", type: "weapon", rarity: "rare", levelRequired: 3, attackPower: 25, defensePower: 0, price: 400 },
          { name: "Iron Armor", type: "armor", rarity: "rare", levelRequired: 3, attackPower: 0, defensePower: 30, price: 500 },
          { name: "Leather Armor", type: "armor", rarity: "common", levelRequired: 1, attackPower: 0, defensePower: 10, price: 150 },
          { name: "Dragon Scale Armor", type: "armor", rarity: "legendary", levelRequired: 10, attackPower: 0, defensePower: 100, price: 6000 },
          { name: "Steel Chestplate", type: "armor", rarity: "epic", levelRequired: 5, attackPower: 0, defensePower: 50, price: 1200 },
          { name: "Ring of Power", type: "accessory", rarity: "epic", levelRequired: 5, attackPower: 15, defensePower: 10, price: 800 },
          { name: "Amulet of Health", type: "accessory", rarity: "rare", levelRequired: 3, attackPower: 5, defensePower: 15, price: 400 },
          { name: "Cursed Necklace", type: "accessory", rarity: "legendary", levelRequired: 8, attackPower: 25, defensePower: 25, price: 3000 },
          { name: "Silver Ring", type: "accessory", rarity: "common", levelRequired: 1, attackPower: 2, defensePower: 2, price: 50 },
          { name: "Health Potion", type: "potion", rarity: "common", levelRequired: 1, attackPower: 0, defensePower: 0, price: 30 },
          { name: "Mana Potion", type: "potion", rarity: "common", levelRequired: 1, attackPower: 0, defensePower: 0, price: 35 },
          { name: "Elixir of Strength", type: "potion", rarity: "rare", levelRequired: 4, attackPower: 10, defensePower: 5, price: 250 },
          { name: "Potion of Invincibility", type: "potion", rarity: "legendary", levelRequired: 10, attackPower: 50, defensePower: 50, price: 5000 },
        ],
      })
    ]);
    console.log("Seeding completed!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
};

seed();
