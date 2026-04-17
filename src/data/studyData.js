import { unitsQuestions } from './physics_units_data'
export const subjects = [
  {
    id: "physics",
    name: "Physics",
    emoji: "⚛️",
    tagline: "Unravel the laws of the universe",
    color: "#3b82f6",
    gradient: "from-blue-500/20 to-cyan-500/10",
    glowColor: "rgba(59, 130, 246, 0.25)",
    borderHover: "hover:border-blue-500/40",
    accentBg: "bg-blue-500/10",
    accentText: "text-blue-400",
    accentBorder: "border-blue-500/30",
    chapters: [
      {
        id: "units-measurements",
        name: "Units & Measurements",
        icon: "📏",
        description: "Dimensional analysis, errors and instruments",
        questionCount: 194,
        questions: unitsQuestions,
      },
      {
        id: "kinematics",
        name: "Kinematics",
        icon: "🚀",
        description: "Motion, velocity, and acceleration",
        questionCount: 5,
        questions: [
          {
            id: 1,
            question:
              "A car accelerates from rest to 72 km/h in 10 seconds. What is its acceleration?",
            options: ["1 m/s²", "2 m/s²", "4 m/s²", "5 m/s²"],
            correctAnswer: "2 m/s²",
            explanation:
              "Convert 72 km/h → 20 m/s. Using a = (v - u)/t = (20 - 0)/10 = 2 m/s²",
            difficulty: "Easy",
          },
          {
            id: 2,
            question:
              "A ball is thrown vertically upward with a velocity of 20 m/s. How high does it go? (g = 10 m/s²)",
            options: ["10 m", "15 m", "20 m", "40 m"],
            correctAnswer: "20 m",
            explanation: "Using v² = u² - 2gs → 0 = 400 - 20s → s = 20 m",
            difficulty: "Medium",
          },
          {
            id: 3,
            question:
              "What is the range of a projectile launched at 45° with initial speed 20 m/s?",
            options: ["20 m", "30 m", "40 m", "80 m"],
            correctAnswer: "40 m",
            explanation: "R = u²sin(2θ)/g = 400 × sin(90°)/10 = 400/10 = 40 m",
            difficulty: "Medium",
          },
          {
            id: 4,
            question:
              "A train travels 150 km in 3 hours. What is its average speed in m/s?",
            options: ["11.11 m/s", "13.89 m/s", "16.67 m/s", "50 m/s"],
            correctAnswer: "13.89 m/s",
            explanation: "150 km/3 h = 50 km/h = 50 × (1000/3600) ≈ 13.89 m/s",
            difficulty: "Easy",
          },
          {
            id: 5,
            question:
              "A stone is dropped from a height of 80 m. How long does it take to reach the ground? (g = 10 m/s²)",
            options: ["2 seconds", "3 seconds", "4 seconds", "8 seconds"],
            correctAnswer: "4 seconds",
            explanation: "h = ½gt² → 80 = ½ × 10 × t² → t² = 16 → t = 4 s",
            difficulty: "Easy",
          },
        ],
      },
      {
        id: "newton-laws",
        name: "Newton's Laws",
        icon: "🍎",
        description: "Force, mass, and motion dynamics",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question:
              "A 5 kg object is pushed with a net force of 20 N. What is its acceleration?",
            options: ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
            correctAnswer: "4 m/s²",
            explanation: "F = ma → a = F/m = 20/5 = 4 m/s²",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "Which correctly states Newton's Third Law of Motion?",
            options: [
              "An object at rest stays at rest unless acted upon",
              "Force equals mass times acceleration",
              "Every action has an equal and opposite reaction",
              "Acceleration is inversely proportional to mass",
            ],
            correctAnswer: "Every action has an equal and opposite reaction",
            explanation:
              "For every force exerted by object A on object B, B exerts an equal and opposite force on A.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question:
              "A 30 N force is applied on a box but 10 N friction opposes it. What is the net force?",
            options: ["10 N", "20 N", "30 N", "40 N"],
            correctAnswer: "20 N",
            explanation: "Net force = Applied - Friction = 30 - 10 = 20 N",
            difficulty: "Medium",
          },
          {
            id: 4,
            question:
              "What is the weight of a 60 kg person on Earth? (g = 9.8 m/s²)",
            options: ["60 N", "490 N", "588 N", "600 N"],
            correctAnswer: "588 N",
            explanation: "W = mg = 60 × 9.8 = 588 N",
            difficulty: "Easy",
          },
        ],
      },
      {
        id: "thermodynamics",
        name: "Thermodynamics",
        icon: "🔥",
        description: "Heat, entropy, and energy transfer",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "What does the First Law of Thermodynamics state?",
            options: [
              "Heat always flows from cold to hot",
              "Entropy always increases",
              "Energy cannot be created or destroyed, only transferred",
              "Absolute zero is unattainable",
            ],
            correctAnswer:
              "Energy cannot be created or destroyed, only transferred",
            explanation:
              "ΔU = Q - W, where ΔU is change in internal energy, Q is heat added, W is work done by system.",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "What is the SI unit of temperature?",
            options: [
              "Celsius (°C)",
              "Fahrenheit (°F)",
              "Kelvin (K)",
              "Rankine (R)",
            ],
            correctAnswer: "Kelvin (K)",
            explanation:
              "The Kelvin is the base SI unit for thermodynamic temperature. 0 K is absolute zero.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Convert 100°C to Kelvin.",
            options: ["173 K", "273 K", "373 K", "473 K"],
            correctAnswer: "373 K",
            explanation: "K = °C + 273.15 → 100 + 273 = 373 K",
            difficulty: "Easy",
          },
          {
            id: 4,
            question:
              "What happens to pressure when temperature increases at constant volume?",
            options: [
              "Pressure decreases",
              "Pressure stays the same",
              "Pressure increases",
              "Volume increases",
            ],
            correctAnswer: "Pressure increases",
            explanation:
              "By Gay-Lussac's Law, P ∝ T at constant volume. Higher temp = faster molecules = higher pressure.",
            difficulty: "Medium",
          },
        ],
      },
      {
        id: "waves",
        name: "Waves & Optics",
        icon: "🌊",
        description: "Light, sound, and wave phenomena",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "What is the speed of light in a vacuum?",
            options: [
              "3 × 10⁶ m/s",
              "3 × 10⁷ m/s",
              "3 × 10⁸ m/s",
              "3 × 10⁹ m/s",
            ],
            correctAnswer: "3 × 10⁸ m/s",
            explanation:
              "The speed of light c = 299,792,458 m/s ≈ 3 × 10⁸ m/s. It is a universal constant.",
            difficulty: "Easy",
          },
          {
            id: 2,
            question:
              "A wave has frequency 500 Hz and wavelength 0.6 m. What is its speed?",
            options: ["200 m/s", "250 m/s", "300 m/s", "500 m/s"],
            correctAnswer: "300 m/s",
            explanation: "v = fλ = 500 × 0.6 = 300 m/s",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "What type of wave is a sound wave?",
            options: [
              "Transverse wave",
              "Longitudinal wave",
              "Electromagnetic wave",
              "Surface wave",
            ],
            correctAnswer: "Longitudinal wave",
            explanation:
              "Sound waves are longitudinal — particle displacement is parallel to wave propagation direction.",
            difficulty: "Easy",
          },
          {
            id: 4,
            question:
              "What is the refractive index if light slows from 3×10⁸ to 2×10⁸ m/s?",
            options: ["1.0", "1.2", "1.5", "2.0"],
            correctAnswer: "1.5",
            explanation: "n = c/v = (3×10⁸)/(2×10⁸) = 1.5",
            difficulty: "Medium",
          },
        ],
      },
    ],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    emoji: "🧪",
    tagline: "Explore the building blocks of matter",
    color: "#10b981",
    gradient: "from-emerald-500/20 to-teal-500/10",
    glowColor: "rgba(16, 185, 129, 0.25)",
    borderHover: "hover:border-emerald-500/40",
    accentBg: "bg-emerald-500/10",
    accentText: "text-emerald-400",
    accentBorder: "border-emerald-500/30",
    chapters: [
      {
        id: "periodic-table",
        name: "Periodic Table",
        icon: "📊",
        description: "Elements, periods, and groups",
        questionCount: 5,
        questions: [
          {
            id: 1,
            question: "How many elements are in the modern periodic table?",
            options: [
              "92 elements",
              "108 elements",
              "118 elements",
              "126 elements",
            ],
            correctAnswer: "118 elements",
            explanation:
              "The modern periodic table has 118 confirmed elements, from Hydrogen (1) to Oganesson (118).",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "What is the atomic number of Carbon?",
            options: ["4", "6", "8", "12"],
            correctAnswer: "6",
            explanation:
              "Carbon (C) has 6 protons, so its atomic number is 6. It is in Period 2, Group 14.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Which is the most electronegative element?",
            options: [
              "Oxygen (O)",
              "Chlorine (Cl)",
              "Nitrogen (N)",
              "Fluorine (F)",
            ],
            correctAnswer: "Fluorine (F)",
            explanation:
              "Fluorine has an electronegativity of 3.98 on the Pauling scale — the highest of all elements.",
            difficulty: "Medium",
          },
          {
            id: 4,
            question: "Name the noble gas in Period 3.",
            options: ["Neon (Ne)", "Helium (He)", "Argon (Ar)", "Krypton (Kr)"],
            correctAnswer: "Argon (Ar)",
            explanation:
              "Argon (Ar, atomic number 18) is the noble gas in Period 3 of the periodic table.",
            difficulty: "Easy",
          },
          {
            id: 5,
            question: "Which group contains the alkali metals?",
            options: ["Group 1", "Group 2", "Group 17", "Group 18"],
            correctAnswer: "Group 1",
            explanation:
              "Group 1 elements (Li, Na, K, Rb, Cs, Fr) are alkali metals — very reactive, single valence electron.",
            difficulty: "Easy",
          },
        ],
      },
      {
        id: "chemical-bonding",
        name: "Chemical Bonding",
        icon: "🔗",
        description: "Ionic, covalent, and metallic bonds",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "What type of bond forms between Na and Cl in NaCl?",
            options: [
              "Covalent bond",
              "Ionic bond",
              "Metallic bond",
              "Hydrogen bond",
            ],
            correctAnswer: "Ionic bond",
            explanation:
              "Na donates an electron to Cl, creating Na⁺ and Cl⁻ ions attracted by electrostatic forces.",
            difficulty: "Easy",
          },
          {
            id: 2,
            question:
              "How many covalent bonds does a carbon atom typically form?",
            options: ["2 bonds", "3 bonds", "4 bonds", "6 bonds"],
            correctAnswer: "4 bonds",
            explanation:
              "Carbon has 4 valence electrons and needs 4 more to complete its octet, forming 4 covalent bonds.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "What is a hydrogen bond?",
            options: [
              "A bond inside a hydrogen molecule",
              "A covalent bond with hydrogen",
              "A weak attraction between H and electronegative atoms (N, O, F)",
              "An ionic bond formed by hydrogen",
            ],
            correctAnswer:
              "A weak attraction between H and electronegative atoms (N, O, F)",
            explanation:
              "Hydrogen bonds form when H bonded to N/O/F is attracted to lone pairs on another N/O/F atom.",
            difficulty: "Medium",
          },
          {
            id: 4,
            question: "What is the shape of a water molecule?",
            options: [
              "Linear (180°)",
              "Trigonal planar (120°)",
              "Tetrahedral (109.5°)",
              "Bent / V-shaped (104.5°)",
            ],
            correctAnswer: "Bent / V-shaped (104.5°)",
            explanation:
              "Water has 2 bonding pairs and 2 lone pairs on O. Lone pairs repel, bending the angle to 104.5°.",
            difficulty: "Medium",
          },
        ],
      },
      {
        id: "acids-bases",
        name: "Acids & Bases",
        icon: "⚗️",
        description: "pH, reactions, and neutralization",
        questionCount: 5,
        questions: [
          {
            id: 1,
            question: "What is the pH of pure water at 25°C?",
            options: ["0", "5", "7", "14"],
            correctAnswer: "7",
            explanation:
              "Pure water is neutral — [H⁺] = [OH⁻] = 10⁻⁷ mol/L, so pH = -log(10⁻⁷) = 7.",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "What are the products of an acid-base neutralization?",
            options: [
              "Acid and water",
              "Salt and water",
              "Base and gas",
              "Oxide and water",
            ],
            correctAnswer: "Salt and water",
            explanation:
              "Acid + Base → Salt + Water. E.g., HCl + NaOH → NaCl + H₂O",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Which is a stronger acid: HCl or CH₃COOH?",
            options: [
              "CH₃COOH",
              "HCl",
              "They are equal",
              "Depends on concentration",
            ],
            correctAnswer: "HCl",
            explanation:
              "HCl is a strong acid — fully dissociates in water. Acetic acid (CH₃COOH) is a weak acid.",
            difficulty: "Medium",
          },
          {
            id: 4,
            question: "How does a Brønsted-Lowry acid behave?",
            options: [
              "Accepts a proton (H⁺)",
              "Donates a proton (H⁺)",
              "Donates an electron pair",
              "Accepts an electron pair",
            ],
            correctAnswer: "Donates a proton (H⁺)",
            explanation:
              "In Brønsted-Lowry theory, an acid donates H⁺ to a base. The base accepts the proton.",
            difficulty: "Medium",
          },
          {
            id: 5,
            question:
              "What color does litmus paper turn in an acidic solution?",
            options: ["Blue", "Green", "Yellow", "Red"],
            correctAnswer: "Red",
            explanation:
              "Litmus paper turns red below pH 7 (acidic) and blue above pH 7 (basic).",
            difficulty: "Easy",
          },
        ],
      },
      {
        id: "organic-chemistry",
        name: "Organic Chemistry",
        icon: "🧬",
        description: "Hydrocarbons and functional groups",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "What is the general formula for alkanes?",
            options: ["CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙH₂ₙ₊₂", "CₙHₙ"],
            correctAnswer: "CₙH₂ₙ₊₂",
            explanation:
              "Alkanes are saturated hydrocarbons. E.g., methane CH₄ (n=1), ethane C₂H₆ (n=2).",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "What functional group defines alcohols?",
            options: [
              "Carbonyl group (C=O)",
              "Carboxyl group (-COOH)",
              "Hydroxyl group (-OH)",
              "Amino group (-NH₂)",
            ],
            correctAnswer: "Hydroxyl group (-OH)",
            explanation:
              "Alcohols contain the -OH group. E.g., methanol CH₃OH, ethanol C₂H₅OH.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "What is isomerism?",
            options: [
              "Atoms with the same mass but different atomic numbers",
              "Compounds with the same formula but different structures",
              "Elements in the same group of the periodic table",
              "Molecules with identical physical properties",
            ],
            correctAnswer:
              "Compounds with the same formula but different structures",
            explanation:
              "E.g., butane and isobutane both have formula C₄H₁₀ but different structures.",
            difficulty: "Medium",
          },
          {
            id: 4,
            question: "Name the simplest aromatic compound.",
            options: [
              "Methane (CH₄)",
              "Ethylene (C₂H₄)",
              "Acetylene (C₂H₂)",
              "Benzene (C₆H₆)",
            ],
            correctAnswer: "Benzene (C₆H₆)",
            explanation:
              "Benzene is a cyclic compound with 6 carbons and delocalized π electrons, making it aromatic.",
            difficulty: "Medium",
          },
        ],
      },
    ],
  },
  {
    id: "maths",
    name: "Mathematics",
    emoji: "📐",
    tagline: "Master the language of logic",
    color: "#f59e0b",
    gradient: "from-amber-500/20 to-orange-500/10",
    glowColor: "rgba(245, 158, 11, 0.25)",
    borderHover: "hover:border-amber-500/40",
    accentBg: "bg-amber-500/10",
    accentText: "text-amber-400",
    accentBorder: "border-amber-500/30",
    chapters: [
      {
        id: "algebra",
        name: "Algebra",
        icon: "✖️",
        description: "Equations, polynomials, and expressions",
        questionCount: 5,
        questions: [
          {
            id: 1,
            question: "Solve: 3x + 7 = 22",
            options: ["x = 3", "x = 4", "x = 5", "x = 7"],
            correctAnswer: "x = 5",
            explanation: "3x = 22 - 7 = 15 → x = 15/3 = 5",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "Factorize: x² - 9",
            options: [
              "(x - 3)²",
              "(x + 9)(x - 1)",
              "(x + 3)(x - 3)",
              "(x - 3)(x - 3)",
            ],
            correctAnswer: "(x + 3)(x - 3)",
            explanation:
              "Difference of squares: a² - b² = (a+b)(a-b). Here a=x, b=3.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Solve the quadratic: x² - 5x + 6 = 0",
            options: [
              "x = 1 or x = 6",
              "x = 2 or x = 3",
              "x = −2 or x = −3",
              "x = 0 or x = 5",
            ],
            correctAnswer: "x = 2 or x = 3",
            explanation: "Factor: (x-2)(x-3) = 0. So x = 2 or x = 3.",
            difficulty: "Medium",
          },
          {
            id: 4,
            question: "If log₂(x) = 5, find x.",
            options: ["x = 10", "x = 16", "x = 25", "x = 32"],
            correctAnswer: "x = 32",
            explanation: "log₂(x) = 5 means 2⁵ = x → x = 32",
            difficulty: "Medium",
          },
          {
            id: 5,
            question: "Simplify: (a²b³)² ÷ a²b",
            options: ["a⁴b⁵", "a²b⁵", "a⁶b⁵", "a²b⁶"],
            correctAnswer: "a²b⁵",
            explanation: "(a²b³)² = a⁴b⁶. Divide by a²b: a⁴⁻²b⁶⁻¹ = a²b⁵",
            difficulty: "Medium",
          },
        ],
      },
      {
        id: "geometry",
        name: "Geometry",
        icon: "📏",
        description: "Shapes, angles, and theorems",
        questionCount: 5,
        questions: [
          {
            id: 1,
            question: "What is the sum of interior angles of a triangle?",
            options: ["90°", "180°", "270°", "360°"],
            correctAnswer: "180°",
            explanation:
              "All triangles, regardless of type, have interior angles summing to exactly 180°.",
            difficulty: "Easy",
          },
          {
            id: 2,
            question: "Find the area of a circle with radius 7 cm. (π ≈ 3.14)",
            options: ["44 cm²", "78.5 cm²", "153.86 cm²", "196 cm²"],
            correctAnswer: "153.86 cm²",
            explanation: "A = πr² = 3.14 × 49 = 153.86 cm²",
            difficulty: "Easy",
          },
          {
            id: 3,
            question:
              "In a right triangle, legs are 3 cm and 4 cm. Find the hypotenuse.",
            options: ["5 cm", "6 cm", "7 cm", "8 cm"],
            correctAnswer: "5 cm",
            explanation:
              "Pythagorean theorem: c² = 3² + 4² = 9 + 16 = 25 → c = 5",
            difficulty: "Easy",
          },
          {
            id: 4,
            question: "What is the volume of a sphere with radius 3 cm?",
            options: ["28.3 cm³", "75.4 cm³", "113.1 cm³", "150.8 cm³"],
            correctAnswer: "113.1 cm³",
            explanation: "V = (4/3)πr³ = (4/3) × 3.14 × 27 ≈ 113.1 cm³",
            difficulty: "Medium",
          },
          {
            id: 5,
            question: "Find the perimeter of a regular hexagon with side 5 cm.",
            options: ["20 cm", "25 cm", "30 cm", "36 cm"],
            correctAnswer: "30 cm",
            explanation:
              "A regular hexagon has 6 equal sides. Perimeter = 6 × 5 = 30 cm",
            difficulty: "Easy",
          },
        ],
      },
      {
        id: "calculus",
        name: "Calculus",
        icon: "∫",
        description: "Limits, derivatives, and integrals",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "Differentiate f(x) = x³ + 4x² − 7",
            options: [
              "f'(x) = 3x² + 8",
              "f'(x) = 3x² + 8x",
              "f'(x) = x² + 8x",
              "f'(x) = 3x + 8x",
            ],
            correctAnswer: "f'(x) = 3x² + 8x",
            explanation: "Power rule: d/dx(xⁿ) = nxⁿ⁻¹. So 3x² + 8x + 0.",
            difficulty: "Medium",
          },
          {
            id: 2,
            question: "What is the derivative of sin(x)?",
            options: ["-cos(x)", "cos(x)", "-sin(x)", "tan(x)"],
            correctAnswer: "cos(x)",
            explanation:
              "d/dx[sin(x)] = cos(x). This is a standard trigonometric derivative.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Find ∫2x dx",
            options: ["x + C", "2x² + C", "x² + C", "½x² + C"],
            correctAnswer: "x² + C",
            explanation:
              "∫2x dx = 2 × x²/2 + C = x² + C. Always add constant of integration C.",
            difficulty: "Easy",
          },
          {
            id: 4,
            question: "What is the limit of (sin x)/x as x → 0?",
            options: ["0", "∞", "1", "undefined"],
            correctAnswer: "1",
            explanation:
              "This is a standard limit: lim(x→0) sin(x)/x = 1. Proved by the squeeze theorem.",
            difficulty: "Hard",
          },
        ],
      },
      {
        id: "statistics",
        name: "Statistics",
        icon: "📈",
        description: "Data, probability, and distributions",
        questionCount: 4,
        questions: [
          {
            id: 1,
            question: "Find the mean of: 4, 8, 6, 5, 3, 2, 8, 9, 2, 5",
            options: ["4.8", "5.0", "5.2", "5.5"],
            correctAnswer: "5.2",
            explanation: "Sum = 4+8+6+5+3+2+8+9+2+5 = 52. Mean = 52/10 = 5.2",
            difficulty: "Easy",
          },
          {
            id: 2,
            question:
              "What is the probability of getting heads in a fair coin toss?",
            options: ["1/4", "1/3", "1/2", "2/3"],
            correctAnswer: "1/2",
            explanation:
              "A fair coin has 2 equal outcomes (H, T). P(H) = 1/2 = 0.5 = 50%.",
            difficulty: "Easy",
          },
          {
            id: 3,
            question: "Find the median of: 3, 1, 4, 1, 5, 9, 2, 6",
            options: ["3", "3.5", "4", "4.5"],
            correctAnswer: "3.5",
            explanation:
              "Sorted: 1,1,2,3,4,5,6,9. Even count → median = (3+4)/2 = 3.5",
            difficulty: "Easy",
          },
          {
            id: 4,
            question: "What does standard deviation measure?",
            options: [
              "The average value of a dataset",
              "The middle value in a dataset",
              "The spread or dispersion of data around the mean",
              "The highest minus the lowest value",
            ],
            correctAnswer: "The spread or dispersion of data around the mean",
            explanation:
              "A low SD means data is clustered near the mean; a high SD means data is more spread out.",
            difficulty: "Medium",
          },
        ],
      },
    ],
  },
];
