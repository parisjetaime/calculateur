import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight, Calculator, BarChart3, TreeDeciduous } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0d5f4d] flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#0d5f4d]" style={{ fontFamily: 'Manrope, sans-serif' }}>Éco-Calculateur</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0d5f4d] mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Calculez l'empreinte carbone de vos événements
            </h2>
            <p className="text-lg text-gray-600 mb-10">
              Un outil complet pour mesurer et optimiser l'impact environnemental de vos événements professionnels, culturels et sportifs.
            </p>
            <Button 
              data-testid="create-event-btn"
              onClick={() => navigate('/event/new')} 
              className="bg-[#0d5f4d] hover:bg-[#0a4a3d] text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Commencer un nouveau calcul
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-[#f0f7f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-[#0d5f4d] mb-12" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Fonctionnalités
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div data-testid="feature-calculation" className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-[#0d5f4d] rounded-lg flex items-center justify-center mb-4">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0d5f4d] mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Calcul précis</h4>
              <p className="text-gray-600">
                Reproduit fidèlement toutes les formules et règles métier de votre calculateur Excel avec des facteurs d'émission validés.
              </p>
            </div>

            <div data-testid="feature-categories" className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-[#0d5f4d] rounded-lg flex items-center justify-center mb-4">
                <TreeDeciduous className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0d5f4d] mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>9 catégories</h4>
              <p className="text-gray-600">
                Couvre tous les aspects : énergie, transport, restauration, hébergements, déchets, communication, fret, aménagements et achats.
              </p>
            </div>

            <div data-testid="feature-visualization" className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-[#0d5f4d] rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-[#0d5f4d] mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>Visualisation claire</h4>
              <p className="text-gray-600">
                Graphiques et tableaux détaillés pour identifier les principaux postes d'émissions et suivre vos progrès.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#0d5f4d] rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Prêt à démarrer ?</h3>
            <p className="text-lg mb-8 opacity-90">
              Créez votre premier événement et découvrez son impact environnemental en quelques minutes.
            </p>
            <Button 
              data-testid="cta-create-event-btn"
              onClick={() => navigate('/event/new')} 
              className="bg-white text-[#0d5f4d] hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Créer un événement
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;