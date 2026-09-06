import Link from 'next/link';
import { ArrowLeft, SearchX, ShoppingBag } from 'lucide-react';
import { Button, Container, H1, Text } from '@dealos/ui';

export default function NotFound() {
  return (
    <Container className="py-24 text-center space-y-6 max-w-xl">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white shadow-xl shadow-teal-500/20">
        <SearchX className="h-10 w-10" />
      </div>

      <div className="space-y-2">
        <H1 className="text-4xl font-extrabold tracking-tight">404 — Page Not Found</H1>
        <Text className="text-muted-foreground text-base leading-relaxed">
          We couldn’t find the page or deal intelligence listing you were looking for. It may have expired or moved.
        </Text>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/">
          <Button variant="brand" className="gap-2 font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Link href="/deals">
          <Button variant="outline" className="gap-2 font-semibold">
            <ShoppingBag className="h-4 w-4" />
            Browse Live Deals
          </Button>
        </Link>
      </div>
    </Container>
  );
}
