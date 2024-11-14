import { useAtomValue } from 'jotai';
import { getLayoutWithConfiguration, getLayoutWithSideNavigation } from '@/components/Layout';
import {
  AgentManagementPage as CommonAgentManagementPage,
  withInitialFetch,
} from '@pinpoint-fe/ui';
import { configurationAtom } from '@pinpoint-fe/atoms';

export interface AgentManagementPageProps {}
const AgentManagementPage = () => {
  const configuration = useAtomValue(configurationAtom);

  return <CommonAgentManagementPage configuration={configuration} />;
};

export default withInitialFetch((props: AgentManagementPageProps) =>
  getLayoutWithSideNavigation(getLayoutWithConfiguration(<AgentManagementPage {...props} />)),
);
