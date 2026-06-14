"use client"

import { useState } from "react"
import { BookOpen, CheckCircle, XCircle, ChevronRight, Award, Brain, Eye, AlertTriangle } from "lucide-react"

const FICHES = [
  { id: "1", titre: "Le pluralisme médiatique : c'est quoi ?", niveau: "Débutant", duree: "5 min", icon: Eye, color: "bg-blue-50 text-[#1A3A6B]", contenu: "Le pluralisme médiatique désigne la diversité des opinions, courants de pensée et informations représentés dans les médias. Il est fondamental en démocratie car il garantit que tous les citoyens ont accès à des points de vue variés et équilibrés.\n\n**Pourquoi est-ce important ?**\nDans une démocratie, les citoyens doivent pouvoir s'informer auprès de sources variées pour forger leur propre opinion. Un monopole médiatique ou un favoritisme systématique peut manipuler l'opinion publique et fausser le jeu démocratique.\n\n**Le rôle du CNRA**\nLe CNRA surveille en permanence que tous les partis politiques bénéficient d'une couverture équitable, notamment pendant les campagnes électorales." },
  { id: "2", titre: "Comment identifier un contenu partisan ?", niveau: "Intermédiaire", duree: "8 min", icon: AlertTriangle, color: "bg-orange-50 text-orange-700", contenu: "Un contenu partisan favorise un parti ou candidat de façon non justifiée. Voici les signes à repérer :\n\n**Signes évidents :**\n• Temps d'antenne disproportionné pour un seul parti\n• Traitement positif systématique d'un candidat\n• Absence de couverture des partis d'opposition\n• Utilisation de termes péjoratifs envers certains partis\n\n**Signes subtils :**\n• Choix des images (favorables vs défavorables)\n• Ordre de passage dans les bulletins d'info\n• Durée des interviews accordées\n• Questions posées (difficiles vs faciles)\n\n**Comment réagir ?**\nSignalez toute irrégularité sur cette plateforme. Le CNRA dispose d'outils pour vérifier et sanctionner." },
  { id: "3", titre: "Le temps de parole en période électorale", niveau: "Intermédiaire", duree: "10 min", icon: Brain, color: "bg-purple-50 text-purple-700", contenu: "Pendant une campagne électorale, la réglementation impose des règles strictes sur le temps de parole accordé à chaque parti politique.\n\n**Principes fondamentaux :**\n• Équité : tous les partis enregistrés ont droit à une représentation\n• Proportionnalité : les grands partis peuvent avoir plus de temps, mais dans des limites\n• Transparence : les médias doivent déclarer leurs temps d'antenne au CNRA\n\n**Les seuils d'alerte CNRA :**\nSi un parti représente plus de 40% du temps de parole total sur un média, une alerte est automatiquement déclenchée. Une mise en demeure est envoyée si l'écart dépasse 30 points de pourcentage.\n\n**Vos droits :**\nEn tant que citoyen, vous avez le droit de consulter les données de monitoring sur ce portail et de signaler tout déséquilibre observé." },
]

const QUIZ_QUESTIONS = [
  { question: "Quel organisme régule les médias audiovisuels au Sénégal ?", options: ["Le ministère de l'Information", "Le CNRA", "L'ARTP", "La Haute Autorité de la Presse"], correct: 1, explication: "Le CNRA (Conseil National de Régulation de l'Audiovisuel) est l'autorité indépendante chargée de réguler l'audiovisuel sénégalais." },
  { question: "Qu'est-ce que le pluralisme médiatique garantit ?", options: ["Un seul point de vue officiel", "La diversité des opinions dans les médias", "La gratuité des médias", "Le monopole de l'État sur la presse"], correct: 1, explication: "Le pluralisme médiatique garantit la diversité des opinions et courants de pensée représentés dans les médias." },
  { question: "Que faire si vous observez un déséquilibre du temps de parole ?", options: ["Rien, c'est normal", "Changer de chaîne", "Signaler au CNRA via ce portail", "Contacter le journaliste"], correct: 2, explication: "Vous pouvez signaler tout déséquilibre observé directement sur ce portail citoyen. Le CNRA traitera votre signalement." },
  { question: "En période électorale, à partir de quel écart le CNRA déclenche-t-il une alerte ?", options: ["10%", "20%", "50%", "80%"], correct: 1, explication: "Le CNRA déclenche une alerte automatique lorsqu'un écart de 20% ou plus est constaté dans la répartition du temps de parole." },
]

export default function EducationPage() {
  const [selectedFiche, setSelectedFiche] = useState<typeof FICHES[0] | null>(null)
  const [quizStarted, setQuizStarted] = useState(false)
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [quizDone, setQuizDone] = useState(false)

  function answer(idx: number) {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === QUIZ_QUESTIONS[currentQ].correct
    setTimeout(() => {
      const newAnswers = [...answers, correct]
      setAnswers(newAnswers)
      if (currentQ < QUIZ_QUESTIONS.length - 1) {
        setCurrentQ(q => q + 1)
        setSelected(null)
      } else {
        setQuizDone(true)
      }
    }, 1200)
  }

  const score = answers.filter(Boolean).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[#1A3A6B] mb-2 flex items-center gap-3">
          <BookOpen className="size-8" /> Éducation aux médias
        </h1>
        <p className="text-gray-500">Développez votre esprit critique et comprenez vos droits face aux médias</p>
      </div>

      {/* Fiches pédagogiques */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-5">Fiches pédagogiques</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FICHES.map(f => (
            <button key={f.id} onClick={() => setSelectedFiche(f)}
              className={`text-left rounded-2xl p-6 border-2 border-transparent hover:border-current transition-all hover:shadow-md ${f.color}`}>
              <f.icon className="size-8 mb-4 opacity-70" />
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.color} border border-current opacity-60`}>{f.niveau}</span>
                <span className="text-xs text-gray-400">{f.duree}</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base leading-snug mb-3">{f.titre}</h3>
              <span className="text-sm font-semibold flex items-center gap-1">
                Lire la fiche <ChevronRight className="size-4" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Quiz */}
      <section>
        <h2 className="text-xl font-black text-gray-900 mb-5 flex items-center gap-2">
          <Brain className="size-6 text-[#1A3A6B]" /> Quiz — Testez vos connaissances
        </h2>

        {!quizStarted ? (
          <div className="bg-gradient-to-br from-[#1A3A6B] to-[#0f2347] rounded-2xl p-10 text-white text-center">
            <Award className="size-14 text-[#C9A84C] mx-auto mb-4" />
            <h3 className="text-2xl font-black mb-3">Êtes-vous prêt ?</h3>
            <p className="text-blue-300 mb-6 max-w-sm mx-auto">{QUIZ_QUESTIONS.length} questions sur la régulation des médias et le pluralisme au Sénégal</p>
            <button onClick={() => { setQuizStarted(true); setCurrentQ(0); setAnswers([]); setSelected(null); setQuizDone(false) }}
              className="bg-[#C9A84C] hover:bg-[#b8973d] text-white font-black px-10 py-4 rounded-xl transition-colors text-lg">
              Commencer le quiz
            </button>
          </div>
        ) : quizDone ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${score >= 3 ? "bg-green-100" : "bg-orange-100"}`}>
              <Award className={`size-10 ${score >= 3 ? "text-green-600" : "text-orange-600"}`} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{score}/{QUIZ_QUESTIONS.length} bonnes réponses</h3>
            <p className="text-gray-500 mb-6">
              {score === QUIZ_QUESTIONS.length ? "Parfait ! Vous maîtrisez la régulation des médias." :
               score >= 3 ? "Très bien ! Consultez nos fiches pour approfondir." :
               "Continuez à vous former — lisez nos fiches pédagogiques."}
            </p>
            <button onClick={() => { setQuizStarted(false); setQuizDone(false) }}
              className="bg-[#1A3A6B] text-white font-bold px-8 py-3 rounded-xl hover:bg-[#1A3A6B]/90 transition-colors">
              Recommencer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-500">Question {currentQ + 1} / {QUIZ_QUESTIONS.length}</span>
              <div className="flex gap-1">
                {QUIZ_QUESTIONS.map((_, i) => (
                  <div key={i} className={`w-8 h-1.5 rounded-full ${i < currentQ ? "bg-[#1A3A6B]" : i === currentQ ? "bg-[#C9A84C]" : "bg-gray-100"}`} />
                ))}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-6">{QUIZ_QUESTIONS[currentQ].question}</h3>
            <div className="space-y-3">
              {QUIZ_QUESTIONS[currentQ].options.map((opt, i) => {
                const isCorrect = i === QUIZ_QUESTIONS[currentQ].correct
                const isSelected = i === selected
                let style = "border-gray-200 bg-white text-gray-700 hover:border-[#1A3A6B]"
                if (selected !== null) {
                  if (isCorrect) style = "border-green-500 bg-green-50 text-green-800"
                  else if (isSelected) style = "border-red-400 bg-red-50 text-red-800"
                  else style = "border-gray-100 bg-gray-50 text-gray-400"
                }
                return (
                  <button key={i} onClick={() => answer(i)}
                    className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${style}`}>
                    <span>{opt}</span>
                    {selected !== null && isCorrect && <CheckCircle className="size-5 text-green-600" />}
                    {selected !== null && isSelected && !isCorrect && <XCircle className="size-5 text-red-500" />}
                  </button>
                )
              })}
            </div>
            {selected !== null && (
              <div className={`mt-4 p-4 rounded-xl text-sm ${selected === QUIZ_QUESTIONS[currentQ].correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                <strong>{selected === QUIZ_QUESTIONS[currentQ].correct ? "✓ Correct !" : "✗ Incorrect."}</strong>{" "}
                {QUIZ_QUESTIONS[currentQ].explication}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fiche modal */}
      {selectedFiche && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 pt-16 overflow-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedFiche.color}`}>{selectedFiche.niveau}</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedFiche.titre}</h2>
                </div>
                <button onClick={() => setSelectedFiche(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
            </div>
            <div className="p-6 prose prose-sm max-w-none">
              {selectedFiche.contenu.split("\n\n").map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4 whitespace-pre-line">{para}</p>
              ))}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-between items-center">
              <p className="text-xs text-gray-400">Source : CNRA — Conseil National de Régulation de l&apos;Audiovisuel</p>
              <button onClick={() => setSelectedFiche(null)} className="px-5 py-2 bg-[#1A3A6B] text-white font-bold rounded-xl text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
