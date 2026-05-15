// Animated mathematical background focused on the 2020 SOSL paper equations.
// @ts-ignore
import { BlockMath } from "react-katex"

type FloatingFormula = {
  math: string
  top: string
  left: string
  animation: string
}

const formulas: FloatingFormula[] = [
  // Core Cartesian/superconic formulation (paper Eq. 7)
  { math: "f(x,y,z)=OGz^2-2\\left(1+S\\rho^2\\right)z+\\left(O+T\\rho^2\\right)\\rho^2=0", top: "8%", left: "4%", animation: "float1 11s ease-in-out infinite" },
  // Exact sag from the paper (Eq. 9)
  { math: "z(\\rho)=\\frac{1}{OG}\\left(1+S\\rho^2-\\sqrt{1+\\left(2S-O^2G\\right)\\rho^2}\\right)", top: "18%", left: "8%", animation: "float2 13s ease-in-out infinite" },
  // Rationalized sag expression (Eq. 10)
  { math: "z(\\rho)=\\frac{\\left(O+T\\rho^2\\right)\\rho^2}{1+S\\rho^2+\\sqrt{1+\\left(2S-O^2G\\right)\\rho^2}}", top: "30%", left: "5%", animation: "float3 12s ease-in-out infinite" },
  // Transversal coordinate (Eq. 11)
  { math: "r(\\rho)=\\pm\\sqrt{\\rho^2-z^2(\\rho)}", top: "42%", left: "9%", animation: "float4 10s ease-in-out infinite" },
  // GOTS relation in the paper text
  { math: "S^2=GOT", top: "54%", left: "6%", animation: "float5 9s ease-in-out infinite" },
  // SOSL surface coordinate (Eq. 18)
  { math: "z_k(\\rho_k)=\\zeta_k+\\frac{\\left(O_k+T_k\\rho_k^2\\right)\\rho_k^2}{1+S_k\\rho_k^2+\\sqrt{1+\\left(2S_k-O_k^2G_k\\right)\\rho_k^2}}", top: "66%", left: "3%", animation: "float6 14s ease-in-out infinite" },
  // SOSL radial coordinate (Eq. 19)
  { math: "r_k(\\rho_k)=\\pm\\sqrt{\\rho_k^2-\\left(z_k(\\rho_k)-\\zeta_k\\right)^2}", top: "78%", left: "7%", animation: "float1 12s ease-in-out infinite" },
  // Snell-Descartes vector expression used in the paper (Eq. 43)
  { math: "\\hat{u}'=\\eta\\hat{u}-\\eta(\\hat{N}\\cdot\\hat{u})\\hat{N}+\\sqrt{1-\\eta^2\\left(1-(\\hat{N}\\cdot\\hat{u})^2\\right)}\\,\\hat{N}", top: "88%", left: "5%", animation: "float2 15s ease-in-out infinite" },

  // Right side duplicates with varied placement for visual balance
  { math: "G=\\frac{n_i^2z_i-n_o^2z_o}{n_in_o(n_iz_i-n_oz_o)(n_iz_o-n_oz_i)}", top: "10%", left: "60%", animation: "float3 11s ease-in-out infinite" },
  { math: "O=\\frac{n_iz_o-n_oz_i}{z_iz_o(n_i-n_o)}", top: "20%", left: "64%", animation: "float4 13s ease-in-out infinite" },
  { math: "T=\\frac{(n_i-n_o)(n_i+n_o)^2}{4n_in_oz_iz_o(n_iz_i-n_oz_o)}", top: "31%", left: "58%", animation: "float5 10s ease-in-out infinite" },
  { math: "S=\\frac{(n_i+n_o)(n_i^2z_i-n_o^2z_o)}{2n_in_oz_iz_o(n_iz_i-n_oz_o)}", top: "42%", left: "62%", animation: "float6 12s ease-in-out infinite" },
  // Correct thin lens equation (the previous one was wrong in the old background)
  { math: "\\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}", top: "54%", left: "66%", animation: "float1 9s ease-in-out infinite" },
  { math: "n_1\\sin\\theta_1=n_2\\sin\\theta_2", top: "66%", left: "60%", animation: "float2 11s ease-in-out infinite" },
  { math: "\\lambda=\\frac{h}{p}", top: "76%", left: "64%", animation: "float3 14s ease-in-out infinite" },
  { math: "d\\sin\\theta=m\\lambda", top: "87%", left: "61%", animation: "float4 10s ease-in-out infinite" },
]

export function HeroFormulasBg() {
  return (
    <>
      <style>{`
        @keyframes float1 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(18px, -18px); opacity: 0.35; }
          50% { transform: translate(0, -32px); opacity: 0.1; }
          75% { transform: translate(-18px, -18px); opacity: 0.35; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes float2 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-18px, 18px); opacity: 0.25; }
          50% { transform: translate(0, 34px); opacity: 0.08; }
          75% { transform: translate(18px, 18px); opacity: 0.25; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes float3 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(18px, 18px); opacity: 0.45; }
          50% { transform: translate(34px, 0); opacity: 0.12; }
          75% { transform: translate(18px, -18px); opacity: 0.45; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes float4 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-18px, -18px); opacity: 0.35; }
          50% { transform: translate(-34px, 0); opacity: 0.08; }
          75% { transform: translate(-18px, 18px); opacity: 0.35; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes float5 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(12px, -14px); opacity: 0.25; }
          50% { transform: translate(24px, -26px); opacity: 0.08; }
          75% { transform: translate(12px, -14px); opacity: 0.25; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes float6 {
          0% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-12px, 14px); opacity: 0.45; }
          50% { transform: translate(-24px, 26px); opacity: 0.12; }
          75% { transform: translate(-12px, 14px); opacity: 0.45; }
          100% { transform: translate(0, 0); opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0 opacity-20 pointer-events-none z-0 text-white overflow-hidden">
        {formulas.map((formula, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: formula.top,
              left: formula.left,
              fontSize: "1.05rem",
              color: "white",
              animation: formula.animation,
              maxWidth: "38vw",
            }}
          >
            <BlockMath math={formula.math} />
          </div>
        ))}
      </div>
    </>
  )
}
