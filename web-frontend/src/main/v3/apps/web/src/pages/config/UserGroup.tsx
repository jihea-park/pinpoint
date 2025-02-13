import { useAtomValue } from 'jotai';
import {
  getLayoutWithConfiguration,
  getLayoutWithSideNavigation,
} from '@pinpoint-fe/web/components/Layout';
import { UserGroupPage as CommonUserGroupPage, withInitialFetch } from '@pinpoint-fe/ui';
import { configurationAtom } from '@pinpoint-fe/ui/atoms';

export interface UserGroupPageProps {}
const UserGroupPage = () => {
  const configuration = useAtomValue(configurationAtom);

  return <CommonUserGroupPage configuration={configuration} />;
};

export default withInitialFetch((props: UserGroupPageProps) =>
  getLayoutWithSideNavigation(getLayoutWithConfiguration(<UserGroupPage {...props} />)),
);
