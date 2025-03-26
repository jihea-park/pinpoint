import React from 'react';
import { BsGearFill } from 'react-icons/bs';
import { DefaultValue, HeatmapSetting } from './HeatmapSetting';
import HeatmapChart from './HeatmapChart';
import { useStoragedAxisY } from '@pinpoint-fe/ui/src/hooks';
import { APP_SETTING_KEYS } from '@pinpoint-fe/ui/src/constants';

export interface ActiveRequestProps {}

export const HeatmapFetcher = () => {
  const [y, setY] = useStoragedAxisY(APP_SETTING_KEYS.HEATMAP_Y_AXIS_MIN_MAX, [
    DefaultValue.yMin,
    DefaultValue.yMax,
  ]);
  const [showSetting, setShowSetting] = React.useState(false);

  return (
    <div className="relative w-full h-full">
      <div className="flex flex-row items-center justify-end h-full px-4 font-normal text-gray-400">
        <BsGearFill className="text-base cursor-pointer" onClick={() => setShowSetting(true)} />
      </div>
      <HeatmapChart
        setting={{
          yMin: y[0],
          yMax: y[1],
        }}
      />
      {showSetting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="absolute inset-0 opacity-50 bg-background"></div>
          <HeatmapSetting
            className="z-10"
            defaultValues={{
              yMin: y[0],
              yMax: y[1],
            }}
            onClose={() => setShowSetting(false)}
            onApply={(newSetting) => {
              setY([newSetting.yMin, newSetting.yMax]);
            }}
          />
        </div>
      )}
    </div>
  );
};
