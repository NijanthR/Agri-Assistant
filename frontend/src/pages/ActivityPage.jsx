import { useMemo, useState } from 'react'
import {
  ingestKnowledgeBase,
  runAgent,
  runEvaluation,
  runRagQuery,
  runSqlQuery,
} from '../services/agriApi.js'
import { useTheme } from '../context/ThemeContext.jsx'
import farmBg from '../assets/farm.jpg'

function ActivityPage() {
  const { t } = useTheme()
  const [datasetPath, setDatasetPath] = useState('C:/Users/srini/Desktop/AgriAssistant/backend/agricult_data.json')
  const [ragQuery, setRagQuery] = useState('How can I improve water efficiency in agriculture?')
  const [sqlQuery, setSqlQuery] = useState('Show crops with the highest average yield')
  const [agentQuery, setAgentQuery] = useState(
    'Compare fertilizer usage across crops and explain practical implications for farmers.'
  )

  const [busyTask, setBusyTask] = useState('')
  const [ingestResult, setIngestResult] = useState(null)
  const [ragResult, setRagResult] = useState(null)
  const [sqlResult, setSqlResult] = useState(null)
  const [agentResult, setAgentResult] = useState(null)
  const [evalResult, setEvalResult] = useState(null)
  const [error, setError] = useState('')

  const canRun = (task) => !busyTask || busyTask === task

  const evaluationSamples = useMemo(() => {
    if (!ragResult?.query || !ragResult?.answer) {
      return [
        {
          question: 'What methods improve soil fertility?',
          retrieved_context: [
            'Crop rotation, cover crops, and compost are common methods to improve soil fertility.',
          ],
          generated_answer:
            'Soil fertility can be improved with crop rotation, cover crops, and adding organic matter like compost.',
          ground_truth:
            'Use crop rotation, cover crops, organic amendments, and soil testing to improve fertility.',
        },
      ]
    }

    return [
      {
        question: ragResult.query,
        retrieved_context: (ragResult.retrieved_context || []).map((item) => item.content || ''),
        generated_answer: ragResult.answer,
        ground_truth: ragResult.answer,
      },
    ]
  }, [ragResult])

  const handleAction = async (task, action) => {
    setError('')
    setBusyTask(task)
    try {
      await action()
    } catch (err) {
      setError(err.message || 'Operation failed')
    } finally {
      setBusyTask('')
    }
  }

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden ${t.pageBg}`}
      style={{
        backgroundImage: `url(${farmBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="h-full overflow-y-auto p-6 md:p-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <section className={`rounded-2xl border p-5 backdrop-blur-sm ${t.inputContainer}`}>
            <h1 className={`text-xl font-bold ${t.assistantText}`}>Agriculture Intelligence Operations</h1>
            <p className={`mt-1 text-sm ${t.assistantText}`}>
              Run data ingestion, RAG retrieval, text-to-SQL analytics, evaluation, and the intent-driven AI agent.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
              <input
                value={datasetPath}
                onChange={(event) => setDatasetPath(event.target.value)}
                className={`rounded-xl border px-3 py-2 text-sm ${t.inputContainer} ${t.inputText}`}
                placeholder="Dataset path"
              />
              <button
                type="button"
                disabled={!canRun('ingest')}
                onClick={() =>
                  handleAction('ingest', async () => {
                    const result = await ingestKnowledgeBase(datasetPath, [])
                    setIngestResult(result)
                  })
                }
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${t.inputBtnBg} ${t.inputBtn}`}
              >
                {busyTask === 'ingest' ? 'Ingesting...' : 'Ingest Knowledge Base'}
              </button>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className={`rounded-2xl border p-5 backdrop-blur-sm ${t.inputContainer}`}>
              <h2 className={`text-lg font-semibold ${t.assistantText}`}>RAG Query</h2>
              <textarea
                value={ragQuery}
                onChange={(event) => setRagQuery(event.target.value)}
                rows={4}
                className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm ${t.inputContainer} ${t.inputText}`}
              />
              <button
                type="button"
                disabled={!canRun('rag')}
                onClick={() =>
                  handleAction('rag', async () => {
                    const result = await runRagQuery(ragQuery, 5)
                    setRagResult(result)
                  })
                }
                className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${t.inputBtnBg} ${t.inputBtn}`}
              >
                {busyTask === 'rag' ? 'Running...' : 'Run RAG'}
              </button>
            </article>

            <article className={`rounded-2xl border p-5 backdrop-blur-sm ${t.inputContainer}`}>
              <h2 className={`text-lg font-semibold ${t.assistantText}`}>Text-to-SQL</h2>
              <textarea
                value={sqlQuery}
                onChange={(event) => setSqlQuery(event.target.value)}
                rows={4}
                className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm ${t.inputContainer} ${t.inputText}`}
              />
              <button
                type="button"
                disabled={!canRun('sql')}
                onClick={() =>
                  handleAction('sql', async () => {
                    const result = await runSqlQuery(sqlQuery)
                    setSqlResult(result)
                  })
                }
                className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${t.inputBtnBg} ${t.inputBtn}`}
              >
                {busyTask === 'sql' ? 'Running...' : 'Run SQL'}
              </button>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className={`rounded-2xl border p-5 backdrop-blur-sm ${t.inputContainer}`}>
              <h2 className={`text-lg font-semibold ${t.assistantText}`}>AI Agent</h2>
              <textarea
                value={agentQuery}
                onChange={(event) => setAgentQuery(event.target.value)}
                rows={4}
                className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm ${t.inputContainer} ${t.inputText}`}
              />
              <button
                type="button"
                disabled={!canRun('agent')}
                onClick={() =>
                  handleAction('agent', async () => {
                    const result = await runAgent(agentQuery)
                    setAgentResult(result)
                  })
                }
                className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${t.inputBtnBg} ${t.inputBtn}`}
              >
                {busyTask === 'agent' ? 'Running...' : 'Run Agent'}
              </button>
            </article>

            <article className={`rounded-2xl border p-5 backdrop-blur-sm ${t.inputContainer}`}>
              <h2 className={`text-lg font-semibold ${t.assistantText}`}>RAG Evaluation</h2>
              <p className={`mt-2 text-sm ${t.assistantText}`}>
                Evaluates with faithfulness, answer relevance, and context precision.
              </p>
              <button
                type="button"
                disabled={!canRun('eval')}
                onClick={() =>
                  handleAction('eval', async () => {
                    const result = await runEvaluation(evaluationSamples)
                    setEvalResult(result)
                  })
                }
                className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${t.inputBtnBg} ${t.inputBtn}`}
              >
                {busyTask === 'eval' ? 'Evaluating...' : 'Run Evaluation'}
              </button>
            </article>
          </section>

          {error && <section className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</section>}

          <section className="grid gap-5 lg:grid-cols-2">
            <ResultCard title="Ingest Result" payload={ingestResult} tone={t} />
            <ResultCard title="RAG Result" payload={ragResult} tone={t} />
            <ResultCard title="SQL Result" payload={sqlResult} tone={t} />
            <ResultCard title="Agent Result" payload={agentResult} tone={t} />
          </section>

          <ResultCard title="Evaluation Result" payload={evalResult} tone={t} />
        </div>
      </div>
    </div>
  )
}

function ResultCard({ title, payload, tone }) {
  return (
    <article className={`rounded-2xl border p-5 backdrop-blur-sm ${tone.inputContainer}`}>
      <h3 className={`text-base font-semibold ${tone.assistantText}`}>{title}</h3>
      <pre className={`mt-3 max-h-96 overflow-auto rounded-xl border p-3 text-xs ${tone.inputContainer} ${tone.inputText}`}>
        {payload ? JSON.stringify(payload, null, 2) : 'No result yet.'}
      </pre>
    </article>
  )
}

export default ActivityPage
