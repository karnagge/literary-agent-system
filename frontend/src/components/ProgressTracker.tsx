'use client';

interface ProgressTrackerProps {
  progress: number;
  phase: string;
  iteration?: number;
  maxIterations?: number;
}

export default function ProgressTracker({ progress, phase, iteration, maxIterations }: ProgressTrackerProps) {
  const phases = ['planning', 'writing', 'validating', 'editing', 'completed'];
  const currentPhaseIndex = phases.indexOf(phase.toLowerCase());

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
          <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        {['Planning', 'Writing', 'Validating', 'Completed'].map((step, index) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                index <= currentPhaseIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index < currentPhaseIndex ? '✓' : index + 1}
            </div>
            <span className="text-xs font-medium text-gray-700">{step}</span>
          </div>
        ))}
      </div>

      {iteration !== undefined && maxIterations !== undefined && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Iteração {iteration} de {maxIterations}
        </div>
      )}
    </div>
  );
}
