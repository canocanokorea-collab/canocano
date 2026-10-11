import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/context/CartContext';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import VisitorTracker from '@/components/VisitorTracker';
import ContentProtection from '@/components/ContentProtection';

export const metadata: Metadata = {
  metadataBase: new URL('https://canocano.shop'),
  title: {
    default: '카노카노 (CANO CANO) | 반려동물 전문 디자인 스튜디오',
    template: '%s | 카노카노 (CANO CANO)',
  },
  description:
    '반려동물 전문 디자인 스튜디오 카노카노(CANO CANO) 공식 온라인 스토어. 맞춤 각인 젬 목걸이, 프리미엄 원목 캣타워, 반려동물 가구를 만나보세요.',
  keywords: [
    '카노카노',
    'CANO CANO',
    'canocano',
    '카노카노 공식몰',
    '카노카노 쇼핑몰',
    '반려동물 목걸이',
    '강아지 각인 목걸이',
    '고양이 목걸이',
    '오벌 젬 목걸이',
    '플라워 참',
    '원목 캣타워',
    '반려동물 식탁',
    '반려동물 디자인 스튜디오',
  ],
  alternates: {
    canonical: 'https://canocano.shop',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '카노카노 (CANO CANO) | 반려동물 전문 디자인 스튜디오',
    description:
      '반려동물 전문 디자인 스튜디오 카노카노(CANO CANO) 공식 온라인 스토어 - 맞춤 각인 젬 목걸이 & 프리미엄 반려동물 가구',
    url: 'https://canocano.shop',
    siteName: '카노카노 (CANO CANO)',
    images: [
      {
        url: 'https://cdn.imweb.me/upload/S202601287894e63213ee4/931451d814c23.png',
        width: 1200,
        height: 627,
        alt: '카노카노 CANO CANO',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '카노카노 (CANO CANO)',
    description: '반려동물 전문 디자인 스튜디오 카노카노 공식 스토어',
    images: ['https://cdn.imweb.me/upload/S202601287894e63213ee4/931451d814c23.png'],
  },
  other: {
    'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || '',
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://canocano.shop/#website',
      url: 'https://canocano.shop',
      name: '카노카노 (CANO CANO)',
      alternateName: ['카노카노', 'CANO CANO', 'canocano', '카노카노 공식몰', '카노카노 쇼핑몰'],
      description: '반려동물 전문 디자인 스튜디오 - 캣타워, 원목 식탁, 맞춤 각인 젬 목걸이 & 액세서리',
      publisher: {
        '@id': 'https://canocano.shop/#organization',
      },
      inLanguage: 'ko-KR',
    },
    {
      '@type': 'Organization',
      '@id': 'https://canocano.shop/#organization',
      name: '카노카노 (CANO CANO)',
      alternateName: ['카노카노', 'CANO CANO', 'canocano'],
      url: 'https://canocano.shop',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cdn.imweb.me/upload/S202601287894e63213ee4/931451d814c23.png',
      },
      sameAs: [
        'https://www.instagram.com/canocano_official',
        'https://blog.naver.com/cano_cano',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+82-70-7799-0516',
        contactType: 'customer service',
        areaServed: 'KR',
        availableLanguage: 'Korean',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <VisitorTracker />
        <ContentProtection />
        <CartProvider>
          <GlobalErrorBoundary>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </GlobalErrorBoundary>
        </CartProvider>
      </body>
    </html>
  );
}
