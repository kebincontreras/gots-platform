import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getImagePath, getPagePath } from '@/lib/utils';

interface Publication {
  id: number;
  title: string;
  authors: string;
  journal: string;
  conference: string | null;
  year: number;
  image: string | null;
  pdfUrl: string;
  externalUrl: string;
  supplementaryMaterial: string | null;
  starred: boolean;
  abstract: string;
  keywords: string[];
}

async function getPublication(id: string): Promise<Publication | null> {
  try {
    try {
      const { listPublications } = await import("@/lib/store")
      const items = await listPublications()
      const found = items.find((p: any) => String(p.id) === id)
      if (found) return found as any
    } catch {
      // ignore and fall back to JSON file
    }

    const fs = await import("fs")
    const path = await import("path")

    const filePath = path.join(process.cwd(), "public", "publications.json")
    const fileContents = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(fileContents)
    const publications: Publication[] = data.publications || []

    return publications.find((pub) => pub.id.toString() === id) || null
  } catch (error) {
    console.error('Error fetching publication:', error);
    return null;
  }
}

export default async function PublicationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const publication = await getPublication(id);

  if (!publication) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <a 
              href={getPagePath("/publicaciones")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Publicaciones
            </a>
          </Button>
        </div>

        {/* Publication Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-foreground leading-tight">
            {publication.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
            <span className="font-medium">{publication.authors}</span>
            <span>•</span>
            <span>{publication.journal}</span>
            {publication.conference && (
              <>
                <span>•</span>
                <span>{publication.conference}</span>
              </>
            )}
            <span>•</span>
            <span>{publication.year}</span>
            {publication.starred && (
              <Badge variant="secondary" className="ml-2">
                Destacada
              </Badge>
            )}
          </div>

          {/* Keywords */}
          <div className="flex flex-wrap gap-2 mb-6">
            {publication.keywords.map((keyword) => (
              <Badge key={keyword} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Actions */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="p-4">
                <img
                  src={publication.image ? getImagePath(publication.image) : getImagePath("/placeholder.svg")}
                  alt={publication.title}
                  className="w-full h-auto rounded-lg mb-4"
                />
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <a
                      href={publication.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver PDF
                    </a>
                  </Button>
                  
                  {publication.externalUrl && publication.externalUrl !== publication.pdfUrl && (
                    <Button variant="outline" asChild className="w-full">
                      <a
                        href={publication.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver en Journal
                      </a>
                    </Button>
                  )}
                  
                  {publication.supplementaryMaterial && (
                    <Button variant="outline" asChild className="w-full">
                      <a
                        href={publication.supplementaryMaterial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Material Complementario
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Abstract */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Resumen
                </h2>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  {publication.abstract}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Publication Info Card */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Información de la Publicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-foreground">Journal:</span>
                <span className="ml-2 text-muted-foreground">{publication.journal}</span>
              </div>
              {publication.conference && (
                <div>
                  <span className="font-medium text-foreground">Conferencia:</span>
                  <span className="ml-2 text-muted-foreground">{publication.conference}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-foreground">Año:</span>
                <span className="ml-2 text-muted-foreground">{publication.year}</span>
              </div>
              <div>
                <span className="font-medium text-foreground">Autores:</span>
                <span className="ml-2 text-muted-foreground">{publication.authors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generate static params for all publications
export async function generateStaticParams() {
  try {
    // Import the JSON data directly for build time
    const fs = await import('fs');
    const path = await import('path');
    
    const filePath = path.join(process.cwd(), 'public', 'publications.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    const publications: Publication[] = data.publications || [];
    
    return publications.map((publication) => ({
      id: publication.id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
