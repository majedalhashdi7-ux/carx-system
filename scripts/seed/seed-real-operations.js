// scripts/seed/seed-real-operations.js
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getConnection } = require('../../tenants/tenant-db-manager');
const tenantsData = require('../../tenants/tenants.json');

async function seedOperations() {
    console.log('🚀 Seeding real operational statistics, users, orders, and spare parts...');
    
    const tenantsMap = tenantsData.tenants || tenantsData;
    const hmcar = tenantsMap['hmcar'];

    let mongoUri = hmcar.mongoUri;
    if (mongoUri && mongoUri.startsWith('ENV:')) {
        mongoUri = process.env[mongoUri.replace('ENV:', '')];
    }

    try {
        const { models } = await getConnection(hmcar.id, mongoUri);
        const { User, Car, Auction, Bid, SparePart, SpareBrand, Order, Invoice, Review, Brand } = models;

        console.log('🧹 Clearing old operations (Order, Invoice, Bid, SparePart, SpareBrand)...');
        await Order.deleteMany({ tenantId: 'hmcar' });
        await Invoice.deleteMany({ tenantId: 'hmcar' });
        await Bid.deleteMany({ tenantId: 'hmcar' });
        await SparePart.deleteMany({ tenantId: 'hmcar' });
        await SpareBrand.deleteMany({ tenantId: 'hmcar' });
        await Review.deleteMany({ tenantId: 'hmcar' });
        
        // Retain only the super_admin User, clear all other users for hmcar
        await User.deleteMany({ tenantId: 'hmcar', role: { $ne: 'super_admin' } });

        console.log('👥 Seeding realistic clients and staff...');
        const hashedPassword = await bcrypt.hash('Client@123', 10);
        
        const clients = [
            { name: 'عبدالرحمن الشمري', email: 'abdulrahman@gmail.com', username: 'abdulrahman', phone: '+966551234567', role: 'buyer', status: 'active' },
            { name: 'سلطان الحربي', email: 'sultan@gmail.com', username: 'sultan', phone: '+966567890123', role: 'buyer', status: 'active' },
            { name: 'ياسر الدوسري', email: 'yasser@gmail.com', username: 'yasser', phone: '+966541234567', role: 'buyer', status: 'active' },
            { name: 'سارة القحطاني', email: 'sarah@gmail.com', username: 'sarah', phone: '+966553456789', role: 'buyer', status: 'active' },
            { name: 'فيصل العتيبي', email: 'faisal@gmail.com', username: 'faisal', phone: '+966561122334', role: 'buyer', status: 'active' },
            { name: 'خالد المطيري', email: 'khaled@gmail.com', username: 'khaled', phone: '+966504433221', role: 'buyer', status: 'active' },
            { name: 'أحمد الزهراني', email: 'ahmed@gmail.com', username: 'ahmed', phone: '+966539988776', role: 'buyer', status: 'active' },
        ];

        const createdClients = [];
        for (const c of clients) {
            const user = await User.create({
                ...c,
                password: hashedPassword,
                tenantId: 'hmcar'
            });
            createdClients.push(user);
        }
        console.log(`✅ Seeded ${createdClients.length} realistic clients.`);

        console.log('🏷️ Seeding spare brands...');
        const spareBrandsData = [
            { name: 'Hyundai Genuine Parts', key: 'hyundai_parts', logoUrl: 'https://www.car-logos.org/wp-content/uploads/2011/09/hyundai.png', tenantId: 'hmcar' },
            { name: 'Kia Motors Mobis', key: 'kia_parts', logoUrl: 'https://www.car-logos.org/wp-content/uploads/2011/09/kia.png', tenantId: 'hmcar' },
            { name: 'Bosch Performance', key: 'bosch', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Bosch-Logo.svg', tenantId: 'hmcar' },
        ];
        const createdSpareBrands = await SpareBrand.insertMany(spareBrandsData);

        // Find existing showroom cars to link parts to
        const cars = await Car.find({ tenantId: 'hmcar' });
        const palisade = cars.find(c => c.model === 'Palisade') || cars[0];
        const carnival = cars.find(c => c.model === 'Carnival') || cars[1];
        const genesis = cars.find(c => c.model === 'G80') || cars[2];

        console.log('📦 Seeding premium spare parts...');
        const partsData = [
            {
                name: 'مجموعة فحمات فرامل أمامية - جينيسيس G80',
                nameEn: 'Genesis G80 Front Brake Pads Set',
                partType: 'Brakes', price: 380, priceSar: 380, priceUsd: 101.33,
                carMake: 'Genesis', carModel: 'G80', carYear: 2024,
                description: 'فحمات فرامل سيراميك أصلية من Mobis لجينيسيس G80. أداء فرملة فائق وعمر طويل.',
                images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800'],
                stockQty: 45, soldCount: 14, inStock: true, tenantId: 'hmcar'
            },
            {
                name: 'شمعة إضاءة LED أمامية يمين - هيونداي باليسيد 2024',
                nameEn: 'Hyundai Palisade 2024 Right LED Headlight',
                partType: 'Lighting', price: 1450, priceSar: 1450, priceUsd: 386.66,
                carMake: 'Hyundai', carModel: 'Palisade', carYear: 2024,
                description: 'شمعة LED أمامية كاملة الجهة اليمنى أصلية، متوافقة تماماً مع باليسيد 2023-2024.',
                images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'],
                stockQty: 8, soldCount: 3, inStock: true, tenantId: 'hmcar'
            },
            {
                name: 'مصفاة وفلتر زيت محرك أصلي - كيا كارنيفال',
                nameEn: 'Kia Carnival Engine Oil Filter OEM',
                partType: 'Filters', price: 65, priceSar: 65, priceUsd: 17.33,
                carMake: 'Kia', carModel: 'Carnival', carYear: 2023,
                description: 'فلتر زيت محرك أصلي من Kia Genuine Parts لضمان نظافة وحماية المحرك.',
                images: ['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800'],
                stockQty: 120, soldCount: 54, inStock: true, tenantId: 'hmcar'
            },
            {
                name: 'بواجي رياضية بلاتينيوم (طقم 6 حبات) - بوش',
                nameEn: 'Bosch Platinum Spark Plugs (Set of 6)',
                partType: 'Engine', price: 290, priceSar: 290, priceUsd: 77.33,
                carMake: 'Hyundai', carModel: 'Palisade', carYear: 2024,
                description: 'طقم بواجي إشعال بلاتينيوم مزدوجة من Bosch، لأداء احتراق أفضل وتوفير الوقود.',
                images: ['https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=800'],
                stockQty: 30, soldCount: 12, inStock: true, tenantId: 'hmcar'
            },
            {
                name: 'شبك أمامي كروم رياضي - جينيسيس G80',
                nameEn: 'Genesis G80 Front Chrome Grille',
                partType: 'Body', price: 2100, priceSar: 2100, priceUsd: 560,
                carMake: 'Genesis', carModel: 'G80', carYear: 2024,
                description: 'شبك المصد الأمامي الرياضي الفاخر بتصميم الكروم الداكن لجينيسيس G80.',
                images: ['https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800'],
                stockQty: 4, soldCount: 1, inStock: true, tenantId: 'hmcar'
            }
        ];

        const createdParts = [];
        for (const p of partsData) {
            const part = await SparePart.create({
                ...p,
                brand: createdSpareBrands[p.partType === 'Engine' ? 2 : (p.carMake === 'Kia' ? 1 : 0)]._id
            });
            createdParts.push(part);
        }
        console.log(`✅ Seeded ${createdParts.length} premium spare parts.`);

        console.log('🔨 Seeding bids on live auction...');
        const activeAuction = await Auction.findOne({ tenantId: 'hmcar', status: 'running' });
        if (activeAuction) {
            const bidAmounts = [191000, 192500, 194000, 195000];
            for (let i = 0; i < bidAmounts.length; i++) {
                const bidder = createdClients[i % createdClients.length];
                await Bid.create({
                    tenantId: 'hmcar',
                    carId: activeAuction.car,
                    userId: bidder._id,
                    displayName: bidder.name.split(' ')[0] + ' ' + (bidder.name.split(' ')[1] ? bidder.name.split(' ')[1][0] + '.' : ''),
                    amount: bidAmounts[i],
                    createdAt: new Date(Date.now() - (4 - i) * 60 * 60 * 1000)
                });
            }
            activeAuction.currentPrice = 195000;
            await activeAuction.save();
            console.log('✅ Seeded 4 bidding history items for active auction.');
        }

        // Helper price resolution
        const getCarPrice = (carObj) => {
            const sar = carObj.priceSar || carObj.price || 180000;
            const usd = carObj.priceUsd || Math.round(sar / 3.75);
            return { sar, usd };
        };

        const getPartPrice = (partObj) => {
            const sar = partObj.priceSar || partObj.price || 100;
            const usd = partObj.priceUsd || Math.round(sar / 3.75);
            return { sar, usd };
        };

        const palPrice = getCarPrice(palisade);
        const genPrice = getCarPrice(genesis);
        const part0Price = getPartPrice(createdParts[0]);
        const part1Price = getPartPrice(createdParts[1]);
        const part2Price = getPartPrice(createdParts[2]);

        console.log('🛒 Seeding premium purchase orders & invoices...');
        const ordersData = [
            {
                orderNumber: 'HM-2026-0001',
                buyer: createdClients[0]._id,
                status: 'completed',
                items: [
                    { itemType: 'car', refId: palisade._id, titleSnapshot: palisade.title, qty: 1, unitPriceSar: palPrice.sar, unitPriceUsd: palPrice.usd }
                ],
                pricing: {
                    subTotalSar: palPrice.sar, subTotalUsd: palPrice.usd,
                    shippingSar: 7500, shippingUsd: 2000,
                    grandTotalSar: palPrice.sar + 7500, grandTotalUsd: palPrice.usd + 2000
                },
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                notes: 'تم الدفع بالكامل وتم الشحن البحري بنجاح.'
            },
            {
                orderNumber: 'HM-2026-0002',
                buyer: createdClients[1]._id,
                status: 'processing',
                items: [
                    { itemType: 'car', refId: genesis._id, titleSnapshot: genesis.title, qty: 1, unitPriceSar: genPrice.sar, unitPriceUsd: genPrice.usd }
                ],
                pricing: {
                    subTotalSar: genPrice.sar, subTotalUsd: genPrice.usd,
                    shippingSar: 7500, shippingUsd: 2000,
                    grandTotalSar: genPrice.sar + 7500, grandTotalUsd: genPrice.usd + 2000
                },
                createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                notes: 'بانتظار وصول الحاوية إلى ميناء جدة الإسلامي.'
            },
            {
                orderNumber: 'HM-2026-0003',
                buyer: createdClients[2]._id,
                status: 'completed',
                items: [
                    { itemType: 'sparePart', refId: createdParts[0]._id, titleSnapshot: createdParts[0].name, qty: 2, unitPriceSar: part0Price.sar, unitPriceUsd: part0Price.usd },
                    { itemType: 'sparePart', refId: createdParts[2]._id, titleSnapshot: createdParts[2].name, qty: 1, unitPriceSar: part2Price.sar, unitPriceUsd: part2Price.usd }
                ],
                pricing: {
                    subTotalSar: (part0Price.sar * 2) + part2Price.sar,
                    subTotalUsd: (part0Price.usd * 2) + part2Price.usd,
                    shippingSar: 35, shippingUsd: 9.33,
                    grandTotalSar: (part0Price.sar * 2) + part2Price.sar + 35,
                    grandTotalUsd: (part0Price.usd * 2) + part2Price.usd + 9.33
                },
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                notes: 'توصيل محلي سريع عبر أرامكس.'
            },
            {
                orderNumber: 'HM-2026-0004',
                buyer: createdClients[3]._id,
                status: 'pending',
                items: [
                    { itemType: 'sparePart', refId: createdParts[1]._id, titleSnapshot: createdParts[1].name, qty: 1, unitPriceSar: part1Price.sar, unitPriceUsd: part1Price.usd }
                ],
                pricing: {
                    subTotalSar: part1Price.sar, subTotalUsd: part1Price.usd,
                    shippingSar: 35, shippingUsd: 9.33,
                    grandTotalSar: part1Price.sar + 35, grandTotalUsd: part1Price.usd + 9.33
                },
                createdAt: new Date(),
                notes: 'في انتظار تأكيد العميل ودفع عربون الشحن.'
            }
        ];

        for (const o of ordersData) {
            const order = await Order.create({
                ...o,
                tenantId: 'hmcar'
            });

            // Create matching Invoice for each order
            await Invoice.create({
                tenantId: 'hmcar',
                invoiceNumber: order.orderNumber.replace('HM-', 'INV-'),
                buyerName: createdClients.find(c => c._id.toString() === order.buyer.toString()).name,
                buyerPhone: createdClients.find(c => c._id.toString() === order.buyer.toString()).phone,
                items: order.items.map(i => ({
                    description: i.titleSnapshot,
                    qty: i.qty,
                    unitPriceSar: i.unitPriceSar,
                    unitPriceUsd: i.unitPriceUsd
                })),
                totalSar: order.pricing.grandTotalSar,
                totalUsd: order.pricing.grandTotalUsd,
                status: order.status === 'completed' ? 'paid' : (order.status === 'pending' ? 'draft' : 'sent'),
                notes: order.notes
            });
        }
        console.log('✅ Created 4 purchase orders and matching invoices successfully.');

        console.log('⭐ Seeding feedback reviews...');
        const reviewsData = [
            { car: palisade._id, user: createdClients[0]._id, rating: 5, title: 'ممتاز جداً', content: 'تعامل راقي جداً والسيارة وصلت بحالة الوكالة الفحص دقيق.', tenantId: 'hmcar' },
            { car: genesis._id, user: createdClients[1]._id, rating: 5, title: 'خدمة احترافية', content: 'جينيسيس سيارة أحلامي والاستيراد كان سهل وبسيط والدعم متجاوب.', tenantId: 'hmcar' },
            { car: carnival._id, user: createdClients[2]._id, rating: 4, title: 'ممتازة للعوائل', content: 'كيا كرنفال هاي ليموزين ممتازة جداً للعائلة الكبيرة. الشحن أخذ ٣ أسابيع.', tenantId: 'hmcar' }
        ];
        await Review.insertMany(reviewsData);
        console.log('✅ reviews seeded.');

        console.log('\n🌟 Operational Seeding completed successfully! Dashboard has real numbers now.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

seedOperations();
