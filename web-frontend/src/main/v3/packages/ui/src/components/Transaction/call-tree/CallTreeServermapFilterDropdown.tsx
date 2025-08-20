import { AlarmRule } from '@pinpoint-fe/ui/src/constants';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  TraceServerMap,
} from '@pinpoint-fe/ui/src/components';

export interface AlarmTableColumns {
  onClickEdit?: (data?: AlarmRule.AlarmRuleData) => void;
  onClickDelete?: (data?: AlarmRule.AlarmRuleData) => void;
}

export const CallTreeServermapFilterDropdown = ({}: {}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-auto text-xs font-normal">
          Filter by Servermap
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[80vw] h-[50vh]">
        <div className="w-full h-full">
          <TraceServerMap />;
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
