/**
 * @jest-environment jsdom
 * 
 * Minimal Page Render Tests
 * Tests that all main pages render without errors
 */

import * as React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  usePathname: () => '/',
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ products: [], categories: [], total: 0 }),
  })
) as jest.Mock;

// Mock hooks with relative paths
jest.mock('../../hooks/useCart', () => ({
  useCart: () => ({
    items: [],
    itemCount: 0,
    total: 0,
    addToCart: jest.fn(),
    removeFromCart: jest.fn(),
    updateQuantity: jest.fn(),
    adding: false,
  }),
}));

// Mock Header component
jest.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

// Suppress console errors during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Page Render Tests', () => {
  describe('About Page', () => {
    it('renders without crashing', async () => {
      const AboutPage = (await import('../about/page')).default;
      render(<AboutPage />);
      expect(screen.getByText('Our Story')).toBeInTheDocument();
    });

    it('displays mission and vision sections', async () => {
      const AboutPage = (await import('../about/page')).default;
      render(<AboutPage />);
      expect(screen.getByText('Our Mission')).toBeInTheDocument();
      expect(screen.getByText('Our Vision')).toBeInTheDocument();
    });

    it('displays founder information', async () => {
      const AboutPage = (await import('../about/page')).default;
      render(<AboutPage />);
      // Use getAllBy since founder name appears multiple times
      const founderMentions = screen.getAllByText(/Bimal Pradhan/i);
      expect(founderMentions.length).toBeGreaterThan(0);
      // 1996 appears multiple times
      const yearMentions = screen.getAllByText(/1996/);
      expect(yearMentions.length).toBeGreaterThan(0);
      // Check for Tamluk in multiple places
      const tamlukMentions = screen.getAllByText(/Tamluk/i);
      expect(tamlukMentions.length).toBeGreaterThan(0);
    });
  });

  describe('Contact Page', () => {
    it('renders without crashing', async () => {
      const ContactPage = (await import('../contact/page')).default;
      render(<ContactPage />);
      expect(screen.getByText('Get In Touch')).toBeInTheDocument();
    });

    it('displays contact form', async () => {
      const ContactPage = (await import('../contact/page')).default;
      render(<ContactPage />);
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument();
    });

    it('displays store information', async () => {
      const ContactPage = (await import('../contact/page')).default;
      render(<ContactPage />);
      expect(screen.getByText('Visit Our Store')).toBeInTheDocument();
      // Tamluk appears multiple times in the contact page
      const tamlukMentions = screen.getAllByText(/Tamluk/i);
      expect(tamlukMentions.length).toBeGreaterThan(0);
    });

    it('displays FAQ section', async () => {
      const ContactPage = (await import('../contact/page')).default;
      render(<ContactPage />);
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
    });
  });

  describe('Catalog Page', () => {
    it('renders without crashing', async () => {
      const CatalogPage = (await import('../catalog/page')).default;
      render(<CatalogPage />);
      // The page should render a loading state or content
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Categories Page', () => {
    it('renders without crashing', async () => {
      const CategoriesPage = (await import('../categories/page')).default;
      render(<CategoriesPage />);
      expect(document.body).toBeInTheDocument();
    });
  });
});

describe('Navigation Links', () => {
  it('About page has navigation to catalog', async () => {
    const AboutPage = (await import('../about/page')).default;
    render(<AboutPage />);
    const browseLink = screen.getByRole('link', { name: /Browse Collection/i });
    expect(browseLink).toHaveAttribute('href', '/catalog');
  });

  it('Contact page has working email link', async () => {
    const ContactPage = (await import('../contact/page')).default;
    render(<ContactPage />);
    const emailLink = screen.getByRole('link', { name: /info@radhagsarees.com/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:info@radhagsarees.com');
  });
});
