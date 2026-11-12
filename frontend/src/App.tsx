import { useEffect } from 'react';

import { Layout } from './components/Layout';
import { useChaseStore } from './store/useChaseStore';
import { CaseTracker } from './views/CaseTracker';
import { CriticAgentView } from './views/CriticAgentView';
import { DraftingAgentView } from './views/DraftingAgentView';
import { ExecutiveDashboard } from './views/ExecutiveDashboard';
import { HitlReviewView } from './views/HitlReviewView';
import { OrchestratorInbox } from './views/OrchestratorInbox';

export function App() {
  const { activeView, fetchCases, fetchDashboardMetrics, fetchLlmStatus, error } = useChaseStore();

  useEffect(() => {
    void fetchCases();
    void fetchDashboardMetrics();
    void fetchLlmStatus();
  }, [fetchCases, fetchDashboardMetrics, fetchLlmStatus]);

  const renderView = () => {
    switch (activeView) {
      case 'orchestrator-inbox':
        return <OrchestratorInbox />;
      case 'case-tracker':
        return <CaseTracker />;
      case 'ai-drafting-agent':
        return <DraftingAgentView />;
      case 'critic-compliance-qa':
        return <CriticAgentView />;
      case 'human-in-the-loop-review':
        return <HitlReviewView />;
      case 'executive-success-dashboard':
        return <ExecutiveDashboard />;
      default:
        return <OrchestratorInbox />;
    }
  };

  return (
    <Layout>
      {error && (
        <div className="mb-space-md p-space-md rounded-xl bg-status-danger/15 border border-status-danger/40 text-status-danger font-body-sm text-body-sm">
          Backend Connection Notice: {error} (ensure FastAPI is running on port 8000)
        </div>
      )}
      {renderView()}
    </Layout>
  );
}

export default App;
