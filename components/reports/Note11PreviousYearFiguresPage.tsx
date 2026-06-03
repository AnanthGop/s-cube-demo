import React from "react";
import { ArrowLeft } from "lucide-react";

interface Note11PreviousYearFiguresPageProps {
  onBack?: () => void;
}

const Note11PreviousYearFiguresPage: React.FC<
  Note11PreviousYearFiguresPageProps
> = ({ onBack }) => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 mb-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition shadow-sm">
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <h1 className="text-2xl font-bold mb-6">
          Note 11 Previous year's figures
        </h1>

        <div className="border border-gray-300 p-6 rounded">
          <p className="text-gray-800">
            Figures for the previous year have been regrouped wherever necessary
            to conform with current year's groupings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Note11PreviousYearFiguresPage;
