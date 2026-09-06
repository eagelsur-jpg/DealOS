import { hashPassword } from '@dealos/utils';
import { PrismaClient, AffiliateNetwork, DealStatus, AlertType, CommissionStatus, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: { name: 'Electronics' },
    create: { name: 'Electronics', slug: 'electronics' }
  });

  const home = await prisma.category.upsert({
    where: { slug: 'home-kitchen' },
    update: { name: 'Home & Kitchen' },
    create: { name: 'Home & Kitchen', slug: 'home-kitchen' }
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dealos.ai' },
    update: {
      name: 'DealOS Admin',
      role: UserRole.ADMIN,
      password: hashPassword('ChangeThisPassword123!')
    },
    create: {
      email: 'admin@dealos.ai',
      name: 'DealOS Admin',
      role: UserRole.ADMIN,
      password: hashPassword('ChangeThisPassword123!')
    }
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@dealos.ai' },
    update: {
      name: 'DealOS Member',
      role: UserRole.MEMBER,
      password: hashPassword('ChangeThisPassword123!')
    },
    create: {
      email: 'member@dealos.ai',
      name: 'DealOS Member',
      role: UserRole.MEMBER,
      password: hashPassword('ChangeThisPassword123!')
    }
  });

  const amazon = await prisma.merchant.upsert({
    where: { slug: 'amazon' },
    update: { name: 'Amazon', websiteUrl: 'https://www.amazon.com', affiliateNetwork: AffiliateNetwork.AMAZON },
    create: {
      name: 'Amazon',
      slug: 'amazon',
      websiteUrl: 'https://www.amazon.com',
      affiliateNetwork: AffiliateNetwork.AMAZON
    }
  });

  const bestBuy = await prisma.merchant.upsert({
    where: { slug: 'best-buy' },
    update: { name: 'Best Buy', websiteUrl: 'https://www.bestbuy.com', affiliateNetwork: AffiliateNetwork.IMPACT },
    create: {
      name: 'Best Buy',
      slug: 'best-buy',
      websiteUrl: 'https://www.bestbuy.com',
      affiliateNetwork: AffiliateNetwork.IMPACT
    }
  });

  const macbook = await prisma.product.upsert({
    where: { slug: 'macbook-pro-14-m4' },
    update: { name: 'MacBook Pro 14 M4', categoryId: electronics.id },
    create: {
      name: 'MacBook Pro 14 M4',
      slug: 'macbook-pro-14-m4',
      description: 'Apple MacBook Pro 14-inch with M4 chip.',
      categoryId: electronics.id,
      imageUrl: 'https://example.com/macbook.jpg'
    }
  });

  const headphones = await prisma.product.upsert({
    where: { slug: 'sony-wh-1000xm5' },
    update: { name: 'Sony WH-1000XM5', categoryId: electronics.id },
    create: {
      name: 'Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      description: 'Premium noise-canceling headphones.',
      categoryId: electronics.id,
      imageUrl: 'https://example.com/sony-xm5.jpg'
    }
  });

  const vacuum = await prisma.product.upsert({
    where: { slug: 'dyson-v15-detect' },
    update: { name: 'Dyson V15 Detect', categoryId: home.id },
    create: {
      name: 'Dyson V15 Detect',
      slug: 'dyson-v15-detect',
      description: 'Cordless vacuum with laser detection.',
      categoryId: home.id,
      imageUrl: 'https://example.com/dyson-v15.jpg'
    }
  });

  const macbookDeal = await prisma.deal.upsert({
    where: { slug: 'macbook-pro-14-discount' },
    update: {
      title: 'MacBook Pro 14" - 15% off',
      currentPrice: '1699.00',
      previousPrice: '1999.00',
      status: DealStatus.ACTIVE,
      isFeatured: true,
      score: 96
    },
    create: {
      slug: 'macbook-pro-14-discount',
      title: 'MacBook Pro 14" - 15% off',
      description: 'Limited-time markdown on the latest MacBook Pro.',
      productId: macbook.id,
      merchantId: bestBuy.id,
      currentPrice: '1699.00',
      previousPrice: '1999.00',
      status: DealStatus.ACTIVE,
      isFeatured: true,
      score: 96,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  const sonyDeal = await prisma.deal.upsert({
    where: { slug: 'sony-xm5-sale' },
    update: {
      title: 'Sony XM5 Headphones',
      currentPrice: '279.00',
      previousPrice: '399.00',
      status: DealStatus.ACTIVE,
      isHot: true,
      score: 91
    },
    create: {
      slug: 'sony-xm5-sale',
      title: 'Sony XM5 Headphones',
      description: 'Top rated ANC headphones at a record low price.',
      productId: headphones.id,
      merchantId: amazon.id,
      currentPrice: '279.00',
      previousPrice: '399.00',
      status: DealStatus.ACTIVE,
      isHot: true,
      score: 91,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2)
    }
  });

  await prisma.deal.upsert({
    where: { slug: 'dyson-v15-last-week' },
    update: {
      title: 'Dyson V15 Past Offer',
      currentPrice: '649.00',
      previousPrice: '749.00',
      status: DealStatus.EXPIRED,
      isHidden: false,
      score: 72
    },
    create: {
      slug: 'dyson-v15-last-week',
      title: 'Dyson V15 Past Offer',
      description: 'Expired deal for historical pricing context.',
      productId: vacuum.id,
      merchantId: bestBuy.id,
      currentPrice: '649.00',
      previousPrice: '749.00',
      status: DealStatus.EXPIRED,
      score: 72,
      startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    }
  });

  await prisma.coupon.upsert({
    where: {
      merchantId_code: {
        merchantId: amazon.id,
        code: 'SAVE20AUDIO'
      }
    },
    update: {
      dealId: sonyDeal.id,
      isActive: true
    },
    create: {
      code: 'SAVE20AUDIO',
      description: 'Extra 20 USD off on selected audio products.',
      dealId: sonyDeal.id,
      merchantId: amazon.id,
      startsAt: new Date(Date.now() - 1000 * 60 * 60),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      isActive: true
    }
  });

  const affiliateLink = await prisma.affiliateLink.upsert({
    where: { id: 'amazon-sonyxm5-link' },
    update: {
      network: AffiliateNetwork.AMAZON,
      destinationUrl: 'https://www.amazon.com/dp/example',
      trackingTemplate: 'https://www.amazon.com/dp/example?tag=dealos-20'
    },
    create: {
      id: 'amazon-sonyxm5-link',
      merchantId: amazon.id,
      dealId: sonyDeal.id,
      network: AffiliateNetwork.AMAZON,
      destinationUrl: 'https://www.amazon.com/dp/example',
      trackingTemplate: 'https://www.amazon.com/dp/example?tag=dealos-20',
      externalId: 'amz-001'
    }
  });

  await prisma.priceHistory.createMany({
    data: [
      {
        productId: headphones.id,
        merchantId: amazon.id,
        price: '399.00',
        recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28)
      },
      {
        productId: headphones.id,
        merchantId: amazon.id,
        price: '329.00',
        recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14)
      },
      {
        productId: headphones.id,
        merchantId: amazon.id,
        price: '279.00',
        recordedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
      }
    ],
    skipDuplicates: true
  });

  await prisma.review.create({
    data: {
      productId: headphones.id,
      userId: member.id,
      title: 'Great ANC performance',
      body: 'Battery life and sound profile are excellent.',
      rating: 5
    }
  });

  await prisma.favorite.upsert({
    where: {
      userId_productId: {
        userId: member.id,
        productId: headphones.id
      }
    },
    update: {},
    create: {
      userId: member.id,
      productId: headphones.id
    }
  });

  await prisma.alert.upsert({
    where: { id: 'member-headphones-price-alert' },
    update: { isActive: true, targetPrice: '249.00' },
    create: {
      id: 'member-headphones-price-alert',
      userId: member.id,
      productId: headphones.id,
      type: AlertType.PRICE_DROP,
      targetPrice: '249.00'
    }
  });

  const session = await prisma.session.upsert({
    where: { tokenHash: hashPassword('session-token-example') },
    update: { lastActiveAt: new Date(), expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) },
    create: {
      userId: member.id,
      tokenHash: hashPassword('session-token-example'),
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  const click = await prisma.click.create({
    data: {
      dealId: sonyDeal.id,
      affiliateLinkId: affiliateLink.id,
      sessionId: session.id,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
      referrer: 'https://dealos.ai'
    }
  });

  await prisma.commissionEvent.create({
    data: {
      affiliateLinkId: affiliateLink.id,
      clickId: click.id,
      orderId: 'ORDER-1001',
      amount: '12.50',
      status: CommissionStatus.PENDING
    }
  });

  console.log(`Seeded users: ${adminUser.email}, ${member.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
