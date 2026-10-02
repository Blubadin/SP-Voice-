import {useLocale} from '../../i18n/LocaleContext';
import React from 'react';
import { RotateCcw, Edit3 } from 'lucide-react';

interface SecondaryActionButtonsProps {
  onUndo: () => void;
  onEditLast: () => void;
  canUndo?: boolean;
  canEdit?: boolean;
}

export const SecondaryActionButtons: React.FC<SecondaryActionButtonsProps> = ({
  onUndo,
  onEditLast,
  canUndo = true,
  canEdit = true,
}) => {
  const {t}=useLocale();

  return (
    <div className="w-full flex items-center justify-center gap-2.5 py-0.5">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex-1 max-w-[210px] h-10 sm:h-11 rounded-xl flex items-center justify-center gap-2 px-3 text-xs sm:text-sm font-semibold border transition-colors ${
          canUndo
            ? 'bg-[#15181D] hover:bg-[#1B1F26] text-[#F4F6F8] border-[#252A33] active:scale-95 hover:border-[#333A47]'
            : 'bg-[#101216] text-[#697281] border-[#1B1F26] cursor-not-allowed opacity-50'
        }`}
        title={t("Undo last recorded point or event")}
      >
        <RotateCcw className="w-3.5 h-3.5 text-[#A2AAB7]" />
        <span>{t("Undo")}</span>
      </button>

      {/* Edit Last Button */}
      <button
        onClick={onEditLast}
        disabled={!canEdit}
        className={`flex-1 max-w-[210px] h-10 sm:h-11 rounded-xl flex items-center justify-center gap-2 px-3 text-xs sm:text-sm font-semibold border transition-colors ${
          canEdit
            ? 'bg-[#15181D] hover:bg-[#1B1F26] text-[#F4F6F8] border-[#252A33] active:scale-95 hover:border-[#333A47]'
            : 'bg-[#101216] text-[#697281] border-[#1B1F26] cursor-not-allowed opacity-50'
        }`}
        title={t("Edit details of the last recorded event")}
      >
        <Edit3 className="w-3.5 h-3.5 text-[#A2AAB7]" />
        <span>{t("Edit Last")}</span>
      </button>
    </div>
  );
};
