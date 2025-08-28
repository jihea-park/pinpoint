import { APP_SETTING_KEYS, ApplicationType } from '@pinpoint-fe/ui/src/constants';
import { LuStar, LuStarOff } from 'react-icons/lu';
import { useToast } from '../../lib/use-toast';
import { useLocalStorage } from '@pinpoint-fe/ui/src/hooks';
import {
  ApplicationCombinedListForCommon,
  ApplicationCombinedListForCommonProps,
} from './ApplicationCombinedListForCommon';

export interface ApplicationCombinedListProps extends ApplicationCombinedListForCommonProps {
  triggerClassName?: string;
}

export const ApplicationCombinedList = (props: ApplicationCombinedListProps) => {
  const { toast } = useToast();
  const [favoriteList, setFavoriteList] = useLocalStorage<ApplicationType[]>(
    APP_SETTING_KEYS.FAVORLIITE_APPLICATION_LIST,
    [],
  );

  const isFavoriteApplication = (application: ApplicationType) => {
    return favoriteList.some((favoriteApp: ApplicationType) => {
      return (
        favoriteApp.applicationName === application.applicationName &&
        favoriteApp?.serviceType === application?.serviceType
      );
    });
  };

  const handleClickFavorite = (
    e: React.MouseEvent,
    application: ApplicationType,
    option?: { disableToast: boolean },
  ) => {
    e.stopPropagation();

    if (isFavoriteApplication(application)) {
      setFavoriteList(
        favoriteList.filter(
          (favoriteApp: ApplicationType) =>
            !(
              favoriteApp.applicationName === application.applicationName &&
              favoriteApp?.serviceType === application?.serviceType
            ),
        ),
      );
      !option?.disableToast &&
        toast({
          description: (
            <div className="flex items-center gap-1 text-xs">
              <LuStarOff />
              Removed from favorites.
            </div>
          ),
          variant: 'small',
        });
    } else {
      setFavoriteList(
        [...favoriteList, application].sort((a, b) => {
          if (a.applicationName && b.applicationName) {
            return a.applicationName.localeCompare(b.applicationName);
          }
          return 1;
        }),
      );
      !option?.disableToast &&
        toast({
          description: (
            <div className="flex items-center gap-2 text-xs">
              <LuStar className="fill-emerald-400 stroke-emerald-400" />
              Added to favorites.
            </div>
          ),
          variant: 'small',
        });
    }
  };

  return (
    <ApplicationCombinedListForCommon
      favoriteList={favoriteList}
      handleClickFavorite={handleClickFavorite}
      {...props}
    />
  );
};
