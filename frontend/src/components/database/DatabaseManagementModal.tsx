import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DatabaseManagementModalProps,
  EntityType,
  Client,
  Project,
  User,
  Team,
  Skill,
  TaskType,
  Category
} from '../../types/database';
import { apiService } from '../../services/api';
import ClientsTab from './tabs/ClientsTab';
import ProjectsTab from './tabs/ProjectsTab';
import UsersTab from './tabs/UsersTab';
import TeamsTab from './tabs/TeamsTab';
import SkillsTab from './tabs/SkillsTab';
import TaskTypesTab from './tabs/TaskTypesTab';
import CategoriesTab from './tabs/CategoriesTab';
import { ModalHeader } from '../common/modal';
import './DatabaseManagementModal.css';

interface Tab {
  id: EntityType;
  label: string;
  icon: string;
  count?: number;
}

const DatabaseManagementModal: React.FC<DatabaseManagementModalProps> = ({
  isOpen,
  onClose,
  initialTab = EntityType.Clients,
  onDataChange,
  calendarRefreshTrigger
}) => {
  const [activeTab, setActiveTab] = useState<EntityType>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [entityCounts, setEntityCounts] = useState<Record<EntityType, number>>({
    [EntityType.Clients]: 0,
    [EntityType.Projects]: 0,
    [EntityType.Users]: 0,
    [EntityType.Teams]: 0,
    [EntityType.Skills]: 0,
    [EntityType.TaskTypes]: 0,
    [EntityType.Categories]: 0
  });

  const tabs: Tab[] = [
    {
      id: EntityType.Clients,
      label: 'Clients',
      icon: '🏢',
      count: entityCounts[EntityType.Clients]
    },
    {
      id: EntityType.Projects,
      label: 'Projects',
      icon: '📋',
      count: entityCounts[EntityType.Projects]
    },
    {
      id: EntityType.Categories,
      label: 'Categories',
      icon: '🏷️',
      count: entityCounts[EntityType.Categories]
    },
    {
      id: EntityType.TaskTypes,
      label: 'Task Types',
      icon: '📝',
      count: entityCounts[EntityType.TaskTypes]
    },
    {
      id: EntityType.Users,
      label: 'Users',
      icon: '👤',
      count: entityCounts[EntityType.Users]
    },
    {
      id: EntityType.Teams,
      label: 'Teams',
      icon: '👥',
      count: entityCounts[EntityType.Teams]
    },
    {
      id: EntityType.Skills,
      label: 'Skills',
      icon: '🛠️',
      count: entityCounts[EntityType.Skills]
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadEntityCounts();
    }
  }, [isOpen, initialTab]);

  const loadEntityCounts = async () => {
    try {
      setIsLoading(true);

      // Make parallel API calls to get actual counts from clean database using apiService
      const [clients, projects, users, teams, skills, taskTypes, categories] = await Promise.allSettled([
        apiService.get<any[]>('/client').catch(() => []),
        apiService.get<{projects: any[], totalCount: number}>('/project').catch(() => ({projects: [], totalCount: 0})),
        apiService.get<{users: any[], totalCount: number}>('/user').catch(() => ({users: [], totalCount: 0})),
        apiService.get<{teams: any[]}>('/team').catch(() => ({teams: []})),
        apiService.get<{skills: any[]}>('/skill').catch(() => ({skills: []})),
        apiService.get<{taskTypes: any[]}>('/tasktype').catch(() => ({taskTypes: []})),
        apiService.get<any[]>('/category').catch(() => [])
      ]);

      setEntityCounts({
        [EntityType.Clients]: clients.status === 'fulfilled' ? (Array.isArray(clients.value) ? clients.value.length : 0) : 0,
        [EntityType.Projects]: projects.status === 'fulfilled' ? (projects.value?.totalCount || projects.value?.projects?.length || 0) : 0,
        [EntityType.Users]: users.status === 'fulfilled' ? (users.value?.totalCount || users.value?.users?.length || 0) : 0,
        [EntityType.Teams]: teams.status === 'fulfilled' ? (teams.value?.teams?.length || 0) : 0,
        [EntityType.Skills]: skills.status === 'fulfilled' ? (skills.value?.skills?.length || 0) : 0,
        [EntityType.TaskTypes]: taskTypes.status === 'fulfilled' ? (taskTypes.value?.taskTypes?.length || 0) : 0,
        [EntityType.Categories]: categories.status === 'fulfilled' ? (Array.isArray(categories.value) ? categories.value.length : 0) : 0
      });
    } catch (error) {
      console.error('Failed to load entity counts:', error);
      // Set all counts to 0 on error
      setEntityCounts({
        [EntityType.Clients]: 0,
        [EntityType.Projects]: 0,
        [EntityType.Users]: 0,
        [EntityType.Teams]: 0,
        [EntityType.Skills]: 0,
        [EntityType.TaskTypes]: 0,
        [EntityType.Categories]: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId: EntityType) => {
    setActiveTab(tabId);
  };

  const handleClose = () => {
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Tab') {
      // Check if the user is currently focused on a form element
      const activeElement = document.activeElement;
      const isInFormField = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true' ||
        activeElement.closest('form') !== null
      );

      // Only prevent default tab behavior if NOT in a form field
      if (!isInFormField) {
        e.preventDefault();
        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex].id);
      }
    }
  };

  const handleEntityCountChange = useCallback((entityType: EntityType, count: number) => {
    setEntityCounts(prev => ({ ...prev, [entityType]: count }));
  }, []);

  // Create memoized callbacks for each entity type to prevent infinite loops
  const handleClientsCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Clients, count);
  }, [handleEntityCountChange]);

  const handleClientsDataChange = useCallback(() => {
    onDataChange?.();
  }, [onDataChange]);

  const handleProjectsCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Projects, count);
  }, [handleEntityCountChange]);

  const handleTeamsCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Teams, count);
  }, [handleEntityCountChange]);

  const handleSkillsCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Skills, count);
  }, [handleEntityCountChange]);

  const handleTaskTypesCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.TaskTypes, count);
  }, [handleEntityCountChange]);

  const handleUsersCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Users, count);
  }, [handleEntityCountChange]);

  const handleCategoriesCountChange = useCallback((count: number) => {
    handleEntityCountChange(EntityType.Categories, count);
  }, [handleEntityCountChange]);

  const renderTabContent = () => {
    switch (activeTab) {
      case EntityType.Clients:
        return <ClientsTab onEntityCountChange={handleClientsCountChange} onDataChange={handleClientsDataChange} />;
      case EntityType.Projects:
        return <ProjectsTab onEntityCountChange={handleProjectsCountChange} refreshTrigger={calendarRefreshTrigger} />;
      case EntityType.Users:
        return <UsersTab onEntityCountChange={handleUsersCountChange} />;
      case EntityType.Teams:
        return <TeamsTab onEntityCountChange={handleTeamsCountChange} />;
      case EntityType.Skills:
        return <SkillsTab onEntityCountChange={handleSkillsCountChange} />;
      case EntityType.TaskTypes:
        return <TaskTypesTab onEntityCountChange={handleTaskTypesCountChange} />;
      case EntityType.Categories:
        return <CategoriesTab onEntityCountChange={handleCategoriesCountChange} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="database-modal-overlay"
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <motion.div
          className="database-modal-container"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header - Standard */}
          <ModalHeader
            title="Database Management"
            onClose={handleClose}
            variant="primary"
          />

          {/* Tab Navigation */}
          <div className="database-modal-tabs">
            <div className="database-tabs-list" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`database-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`panel-${tab.id}`}
                >
                  <span className="database-tab-icon">{tab.icon}</span>
                  <span className="database-tab-label">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="database-tab-count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="database-modal-content">
            {isLoading ? (
              <div className="database-loading">
                <div className="database-spinner"></div>
                <p>Loading data...</p>
              </div>
            ) : (
              <div
                className="database-tab-panel"
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
              >
                {renderTabContent()}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="database-modal-footer">
            <div className="database-modal-info">
              <span className="database-info-text">
                Press <kbd>Esc</kbd> to close • Use <kbd>Tab</kbd> for navigation
              </span>
            </div>
            {/* Footer actions removed - close button is in header (✕) */}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DatabaseManagementModal;