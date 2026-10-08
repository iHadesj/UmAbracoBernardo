import { motion } from 'framer-motion'
import { CepChecker } from '../components/CepChecker'
import { Footer } from '../components/Chrome'
import { Icon, type IconName } from '../components/Icon'
import { CountUp, Page, Reveal, SplitTitle, staggerChild, staggerParent } from '../components/motion'
import { ProductVisual } from '../components/ProductVisual'
import { gap } from '../components/style'
import { getProduct, PRODUCTS } from '../data/products'
import { brl } from '../lib/format'
import { FREE_SHIPPING_ABOVE } from '../lib/shipping'
import { WA_GENERAL } from '../lib/whatsapp'

const VALUES = [
  { t: 'Feito à mão', d: 'Cada arranjo é montado no ateliê, peça por peça.' },
  { t: 'Do seu jeito', d: 'Nome, cores e mimos escolhidos por você.' },
  { t: 'Com cuidado', d: 'Embalado para chegar perfeito.' },
]

const DELIVERY: { icon: IconName; t: string; d: string }[] = [
  { icon: 'truck', t: 'Grajaú e região', d: `Mesmo dia para pedidos até 14h. Grátis acima de ${brl(FREE_SHIPPING_ABOVE)}.` },
  { icon: 'pin', t: 'Zona Sul e capital', d: 'De 1 a 2 dias úteis, frete calculado pelo CEP.' },
  { icon: 'clock', t: '48h de antecedência', d: 'Para personalizados saírem do jeitinho que você imaginou.' },
]

export default function About() {
  return (
    <Page>
      <div className="container">
        <section className="stack" style={{ ...gap(12), paddingTop: 24 }}>
          <span className="kicker">sobre nós</span>
          <SplitTitle className="h1" text="Um ateliê de *abraços* no Grajaú" />
          <p className="lead">
            O Um abraço, Bernardo nasceu no Jardim Prainha para transformar datas especiais em presentes que emocionam. Cada urso, balão e buquê é montado à mão com o carinho que a sua
            comemoração merece.
          </p>
        </section>

        <div className="grid-fields" style={{ marginTop: 24, alignItems: 'end' }}>
          {['box-amor', 'bubble-urso-aniversario'].map((id, i) => (
            <Reveal key={id} delay={i * 0.1}>
              <motion.div className="arch" style={{ aspectRatio: '4 / 5' }} whileHover={{ y: -6 }}>
                <ProductVisual product={getProduct(id)!} sizes="(min-width: 900px) 30vw, 50vw" />
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal className="section row" style={{ justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { n: 48, s: 'h', l: 'antecedência ideal' },
            { n: PRODUCTS.length, s: '', l: 'presentes na vitrine' },
            { n: 100, s: '%', l: 'montado à mão' },
          ].map((x) => (
            <div key={x.l} className="stack" style={gap(2)}>
              <span className="price" style={{ fontSize: 30 }}>
                <CountUp to={x.n} suffix={x.s} />
              </span>
              <span className="small muted">{x.l}</span>
            </div>
          ))}
        </Reveal>

        <motion.section className="section" variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {VALUES.map((v) => (
            <motion.div key={v.t} className="row" variants={staggerChild} style={{ ...gap(16), padding: '16px 0', borderTop: '1px solid var(--ln)', alignItems: 'baseline' }}>
              <span style={{ width: 120, flex: 'none', fontFamily: 'var(--font-display)', fontStyle: 'var(--em-style)' as 'italic', fontSize: 20, color: 'var(--red)' }}>{v.t}</span>
              <span className="muted">{v.d}</span>
            </motion.div>
          ))}
        </motion.section>

        <section className="section panel panel--soft stack" style={gap(16)}>
          <span className="eyebrow">Entrega</span>
          <h2 className="h2">
            Do ateliê até <em>você</em>
          </h2>
          <motion.div className="stack" style={gap(12)} variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {DELIVERY.map((d) => (
              <motion.div key={d.t} className="panel feature" style={{ padding: 16 }} variants={staggerChild}>
                <span className="feature__icon">
                  <Icon name={d.icon} size={18} />
                </span>
                <div>
                  <b>{d.t}</b>
                  <span>{d.d}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="panel" style={{ padding: 16 }}>
            <CepChecker />
          </div>
          <a href={WA_GENERAL} target="_blank" rel="noreferrer" className="btn btn--primary">
            <Icon name="whatsapp" size={19} /> Falar no WhatsApp
          </a>
        </section>
      </div>
      <Footer />
    </Page>
  )
}
