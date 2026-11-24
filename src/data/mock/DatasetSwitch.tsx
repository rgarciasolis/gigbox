import { DATASET, DATASETS, setDataset } from './dataset'

/** Selector del pie: elige entre datos reales y dummy. Cambiarlo recarga la pagina. */
export default function DatasetSwitch() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--zinc-500)]">
      <span>Datos</span>
      {DATASETS.map((d) => (
        <button
          key={d.value}
          type="button"
          title={d.hint}
          aria-pressed={DATASET === d.value}
          onClick={() => DATASET !== d.value && setDataset(d.value)}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}
