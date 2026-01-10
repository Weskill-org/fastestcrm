import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>

                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
                    <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                </div>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold mb-3">1. Data Security Commitment</h2>
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-4">
                            <p className="text-foreground font-medium">
                                Your data is 100% Secure.
                            </p>
                        </div>
                        <p className="text-muted-foreground">
                            At Fastest.com (a product of Upmarking Solutions Private Limited), we prioritize the security of your data above all else. We implement industry-standard security measures to ensure your information is protected against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">2. Data Deletion Policy</h2>
                        <p className="text-muted-foreground">
                            We believe in your right to be forgotten. <strong>On request, your data can be completely deleted from our systems.</strong>
                        </p>
                        <p className="text-muted-foreground mt-2">
                            If you wish to have your data removed, please contact our support team. Once the request is verified, we will permanently erase all data associated with your account from our active databases.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">3. Information We Collect</h2>
                        <p className="text-muted-foreground">
                            We collect information that you strictly provide to us for the purpose of using our CRM services. This includes account information, customer leads, and usage data necessary to provide and improve our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">4. How We Use Your Information</h2>
                        <p className="text-muted-foreground">
                            Upmarking Solutions Private Limited uses the collected data for various purposes:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                            <li>To provide and maintain our Service</li>
                            <li>To notify you about changes to our Service</li>
                            <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                            <li>To provide customer support</li>
                            <li>To gather analysis or valuable information so that we can improve our Service</li>
                            <li>To monitor the usage of our Service</li>
                            <li>To detect, prevent and address technical issues</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">5. Disclosure of Data</h2>
                        <p className="text-muted-foreground">
                            Upmarking Solutions Private Limited does not sell your personal data. We may disclose your Personal Data in the good faith belief that such action is necessary to:
                        </p>
                        <ul className="list-disc pl-6 mt-2 text-muted-foreground space-y-1">
                            <li>To comply with a legal obligation</li>
                            <li>To protect and defend the rights or property of Upmarking Solutions Private Limited</li>
                            <li>To prevent or investigate possible wrongdoing in connection with the Service</li>
                            <li>To protect the personal safety of users of the Service or the public</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
