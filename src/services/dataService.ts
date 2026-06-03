/**
 * Data service for handling localStorage operations
 * This service replaces the backend API calls for data persistence
 */

const DATA_PREFIX = 's_cube_';

/**
 * Get the key used for localStorage based on module ID
 */
const getLocalStorageKey = (moduleId: string): string => {
  return `${DATA_PREFIX}${moduleId}`;
};

/**
 * Load data for a specific module from localStorage
 */
export const loadData = async (moduleId: string): Promise<any> => {
  try {
    const key = getLocalStorageKey(moduleId);
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Return empty object if no data exists for this module
    return {};
  } catch (error) {
    console.error(`Error loading data for module ${moduleId}:`, error);
    throw new Error(`Failed to load data for module ${moduleId}`);
  }
};

/**
 * Save data for a specific module to localStorage
 */
export const saveData = async (moduleId: string, data: any): Promise<void> => {
  try {
    const key = getLocalStorageKey(moduleId);
    localStorage.setItem(key, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving data for module ${moduleId}:`, error);
    throw new Error(`Failed to save data for module ${moduleId}`);
  }
};

/**
 * Initialize default data for a module if it doesn't exist
 */
export const initializeModuleData = async (moduleId: string, defaultData: any): Promise<void> => {
  try {
    const key = getLocalStorageKey(moduleId);
    const existingData = localStorage.getItem(key);
    
    if (!existingData) {
      localStorage.setItem(key, JSON.stringify(defaultData, null, 2));
    }
  } catch (error) {
    console.error(`Error initializing data for module ${moduleId}:`, error);
  }
};

/**
 * Get all saved data modules
 */
export const getAllModules = (): string[] => {
  const modules: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DATA_PREFIX)) {
      const moduleId = key.substring(DATA_PREFIX.length);
      modules.push(moduleId);
    }
  }
  return modules;
};

/**
 * Clear all data for a specific module
 */
export const clearModuleData = (moduleId: string): void => {
  try {
    const key = getLocalStorageKey(moduleId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing data for module ${moduleId}:`, error);
  }
};

/**
 * Clear all data from the application
 */
export const clearAllData = (): void => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DATA_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};