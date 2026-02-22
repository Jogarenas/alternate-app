import { FloatingFoodHero } from '@/components/ui/hero-section-7';

/**
 * Demo for FloatingFoodHero using Unsplash stock images.
 * Use this in a route or replace the home hero to try the component.
 */
export default function FloatingFoodHeroDemo() {
  const heroImages = [
    {
      src: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop',
      alt: 'A delicious cheeseburger',
      className:
        'w-40 sm:w-56 md:w-64 lg:w-72 top-10 left-4 sm:left-10 md:top-20 md:left-20 animate-float',
    },
    {
      src: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop',
      alt: 'A bamboo steamer with dumplings',
      className:
        'w-28 sm:w-36 md:w-48 top-10 right-4 sm:right-10 md:top-16 md:right-16 animate-float',
    },
    {
      src: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop',
      alt: 'A slice of pizza',
      className:
        'w-32 sm:w-40 md:w-56 bottom-8 right-5 sm:right-10 md:bottom-16 md:right-20 animate-float',
    },
    {
      src: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=200&auto=format&fit=crop',
      alt: 'Basil leaf',
      className: 'w-8 sm:w-12 top-1/4 left-1/3 animate-float',
    },
    {
      src: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200&auto=format&fit=crop',
      alt: 'A slice of tomato',
      className: 'w-8 sm:w-10 top-1/2 right-1/4 animate-float',
    },
    {
      src: 'https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=200&auto=format&fit=crop',
      alt: 'A slice of tomato',
      className: 'w-8 sm:w-10 top-3/4 left-1/4 animate-float',
    },
  ];

  return (
    <div className="w-full">
      <FloatingFoodHero
        title="Better food for more people"
        description="For over a decade, we've enabled our customers to discover new tastes, delivered right to their doorstep."
        images={heroImages}
      />
    </div>
  );
}
