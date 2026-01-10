import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-3">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground">
                            By accessing our website at Fastest.com, accessible from Fastest.com, you are agreeing to be bound by these Website Terms and Conditions of Use and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">2. Service Provider</h2>
                        <p className="text-muted-foreground">
                            Fastest.com is a product of <strong>Upmarking Solutions Private Limited</strong>. All services provided are subject to the governance and policies of Upmarking Solutions Private Limited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">3. Use License</h2>
                        <p className="text-muted-foreground">
                            Permission is granted to temporarily download one copy of the materials on Fastest.com's Website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                            <li>modify or copy the materials;</li>
                            <li>use the materials for any commercial purpose or for any public display;</li>
                            <li>attempt to reverse engineer any software contained on Fastest.com's Website;</li>
                            <li>remove any copyright or other proprietary notations from the materials; or</li>
                            <li>transfer the materials to another person or "mirror" the materials on any other server.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">4. Disclaimer</h2>
                        <p className="text-muted-foreground">
                            All the materials on Fastest.com's Website are provided "as is". Upmarking Solutions Private Limited makes no warranties, may it be expressed or implied, therefore negates all other warranties. Furthermore, Upmarking Solutions Private Limited does not make any representations concerning the accuracy or reliability of the use of the materials on its Website or otherwise relating to such materials or any sites linked to this Website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">5. Limitations</h2>
                        <p className="text-muted-foreground">
                            Upmarking Solutions Private Limited or its suppliers will not be hold accountable for any damages that will arise with the use or inability to use the materials on Fastest.com's Website, even if Upmarking Solutions Private Limited or an authorize representative of this Website has been notified, orally or written, of the possibility of such damage.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
