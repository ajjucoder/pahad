'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Heart, Shield, Users, MapPin, Brain, Globe2, BarChart3, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DisclaimerBanner } from '@/components/shared/disclaimer-banner';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { useLanguage } from '@/providers/language-provider';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#5B7553] to-[#3D5235] flex items-center justify-center shadow-lg shadow-[#5B7553]/20 group-hover:shadow-xl transition-shadow">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              {t('app.name')}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/create-account">
                {t('landing.hero.apply')}
              </Link>
            </Button>
            <Button asChild className="bg-[#5B7553] hover:bg-[#3D5235] text-white shadow-md shadow-[#5B7553]/20">
              <Link href="/login">
                {t('landing.hero.signIn')}
              </Link>
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Organic gradient background */}
          <div className="absolute inset-0 bg-hero-gradient opacity-60" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5B7553]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#C67B5C]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#D4A574]/10 rounded-full blur-2xl" />

          <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative z-10">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              {/* Badge */}
              <motion.div variants={scaleIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5B7553]/10 border border-[#5B7553]/20 mb-8">
                <Shield className="w-4 h-4 text-[#5B7553]" />
                <span className="text-sm font-medium text-[#5B7553]">
                  WHO mhGAP-Aligned Screening
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6"
              >
                {t('landing.hero.title')}
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                {t('landing.hero.subtitle')}
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-[#5B7553] hover:bg-[#3D5235] text-white px-8 py-6 text-lg rounded-2xl shadow-xl shadow-[#5B7553]/30 hover:shadow-2xl transition-all duration-300"
                >
                  <Link href="/login">
                    {t('landing.hero.signIn')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg rounded-2xl border-2 border-[#5B7553]/30 hover:border-[#5B7553] hover:bg-[#5B7553]/5"
                >
                  <Link href="/create-account">
                    {t('landing.hero.apply')}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Wave divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              viewBox="0 0 1440 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <path
                d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                fill="hsl(var(--background))"
              />
            </svg>
          </div>
        </section>

        {/* Problem Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="max-w-6xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t('landing.problem.title')}
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {t('landing.problem.description')}
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="grid md:grid-cols-2 gap-8"
              >
                {[
                  {
                    stat: t('landing.problem.stat1'),
                    label: t('landing.problem.stat1Label'),
                    color: '#C67B5C',
                  },
                  {
                    stat: t('landing.problem.stat2'),
                    label: t('landing.problem.stat2Label'),
                    color: '#5B7553',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 shadow-organic hover:shadow-organic-lg transition-shadow"
                  >
                    <div
                      className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20"
                      style={{ backgroundColor: item.color }}
                    />
                    <div
                      className="text-5xl md:text-6xl font-bold mb-3"
                      style={{ color: item.color }}
                    >
                      {item.stat}
                    </div>
                    <p className="text-lg text-muted-foreground">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="max-w-6xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t('landing.howItWorks.title')}
                </h2>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="grid md:grid-cols-3 gap-8"
              >
                {[
                  {
                    step: '1',
                    title: t('landing.howItWorks.step1.title'),
                    description: t('landing.howItWorks.step1.description'),
                    icon: Users,
                    color: '#5B7553',
                  },
                  {
                    step: '2',
                    title: t('landing.howItWorks.step2.title'),
                    description: t('landing.howItWorks.step2.description'),
                    icon: Brain,
                    color: '#C67B5C',
                  },
                  {
                    step: '3',
                    title: t('landing.howItWorks.step3.title'),
                    description: t('landing.howItWorks.step3.description'),
                    icon: MapPin,
                    color: '#D4A574',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    className="relative"
                  >
                    <Card className="h-full border-0 bg-background shadow-organic hover:shadow-organic-lg transition-all duration-300 overflow-hidden group">
                      <CardContent className="p-8">
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <item.icon className="w-7 h-7" style={{ color: item.color }} />
                        </div>
                        <div
                          className="text-4xl font-bold mb-2 opacity-20"
                          style={{ color: item.color }}
                        >
                          {item.step}
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="max-w-6xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  {t('landing.features.title')}
                </h2>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {[
                  {
                    title: t('landing.features.feature1.title'),
                    description: t('landing.features.feature1.description'),
                    icon: Heart,
                    color: '#5B7553',
                  },
                  {
                    title: t('landing.features.feature2.title'),
                    description: t('landing.features.feature2.description'),
                    icon: Brain,
                    color: '#C67B5C',
                  },
                  {
                    title: t('landing.features.feature3.title'),
                    description: t('landing.features.feature3.description'),
                    icon: Globe2,
                    color: '#D4A574',
                  },
                  {
                    title: t('landing.features.feature4.title'),
                    description: t('landing.features.feature4.description'),
                    icon: BarChart3,
                    color: '#5B7553',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={scaleIn}
                    className="group"
                  >
                    <Card className="h-full border border-border bg-card hover:border-[#5B7553]/30 transition-colors">
                      <CardContent className="p-6">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <item.icon className="w-6 h-6" style={{ color: item.color }} />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="py-12 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <DisclaimerBanner />
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-100px' }}
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-foreground mb-6"
              >
                {t('landing.cta.title')}
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-10"
              >
                {t('landing.cta.description')}
              </motion.p>
              <motion.div variants={fadeInUp}>
                <Button
                  asChild
                  size="lg"
                  className="bg-[#5B7553] hover:bg-[#3D5235] text-white px-10 py-7 text-lg rounded-2xl shadow-xl shadow-[#5B7553]/30"
                >
                  <Link href="/login">
                    {t('landing.cta.button')}
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-4 bottom-4 z-40 flex gap-3 md:hidden">
        <Button asChild variant="outline" className="flex-1 rounded-2xl bg-background/95 shadow-lg backdrop-blur">
          <Link href="/login">
            {t('landing.hero.signIn')}
          </Link>
        </Button>
        <Button asChild className="flex-1 rounded-2xl bg-[#5B7553] text-white shadow-xl shadow-[#5B7553]/30">
          <Link href="/create-account">
            {t('landing.hero.cta')}
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5B7553] flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">{t('app.name')}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('app.tagline')} • {t('common.footer.tagline')}
            </p>
            <LanguageToggle variant="compact" />
          </div>
        </div>
      </footer>
    </div>
  );
}
