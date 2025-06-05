interface TabNavigationProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  tabs: {
    id: string;
    label: string;
    disabled?: boolean;
  }[];
}

export default function TabNavigation({ selectedTab, onTabChange, tabs }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              ${selectedTab === tab.id 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } 
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
