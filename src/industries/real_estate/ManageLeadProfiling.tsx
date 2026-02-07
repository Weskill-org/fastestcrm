import { useState, useEffect } from 'react';
// DashboardLayout removed
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/useCompany';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ProfileLevel {
  id: string;
  label: string;
  children: ProfileLevel[];
}

interface ProfilingConfig {
  levels: ProfileLevel[];
}

const DEFAULT_REAL_ESTATE_CONFIG: ProfilingConfig = {
  levels: [
    {
      id: 'office_space',
      label: 'Office Space',
      children: [
        {
          id: 'office_500_1000',
          label: '500-1000 sq ft',
          children: [
            { id: 'office_immediate', label: 'Immediately', children: [] },
            { id: 'office_3months', label: 'Within 3 months', children: [] },
            { id: 'office_6months', label: 'Within 6 months', children: [] },
          ]
        },
        {
          id: 'office_1000_2000',
          label: '1000-2000 sq ft',
          children: [
            { id: 'office_1k_immediate', label: 'Immediately', children: [] },
            { id: 'office_1k_3months', label: 'Within 3 months', children: [] },
          ]
        },
        {
          id: 'office_2000_plus',
          label: '2000+ sq ft',
          children: [
            { id: 'office_2k_immediate', label: 'Immediately', children: [] },
            { id: 'office_2k_flexible', label: 'Flexible', children: [] },
          ]
        },
      ]
    },
    {
      id: 'residential',
      label: 'Residential',
      children: [
        {
          id: 'res_1bhk',
          label: '1 BHK',
          children: [
            { id: '1bhk_ready', label: 'Ready to Move', children: [] },
            { id: '1bhk_construction', label: 'Under Construction', children: [] },
          ]
        },
        {
          id: 'res_2bhk',
          label: '2 BHK',
          children: [
            { id: '2bhk_ready', label: 'Ready to Move', children: [] },
            { id: '2bhk_construction', label: 'Under Construction', children: [] },
          ]
        },
        {
          id: 'res_3bhk',
          label: '3 BHK',
          children: [
            { id: '3bhk_ready', label: 'Ready to Move', children: [] },
            { id: '3bhk_construction', label: 'Under Construction', children: [] },
          ]
        },
        {
          id: 'res_4bhk_plus',
          label: '4+ BHK',
          children: [
            { id: '4bhk_ready', label: 'Ready to Move', children: [] },
            { id: '4bhk_construction', label: 'Under Construction', children: [] },
          ]
        },
      ]
    },
    {
      id: 'plot',
      label: 'Plot/Land',
      children: [
        {
          id: 'plot_small',
          label: 'Up to 1000 sq yd',
          children: [
            { id: 'plot_small_immediate', label: 'Immediate Purchase', children: [] },
            { id: 'plot_small_investment', label: 'Investment', children: [] },
          ]
        },
        {
          id: 'plot_large',
          label: '1000+ sq yd',
          children: [
            { id: 'plot_large_immediate', label: 'Immediate Purchase', children: [] },
            { id: 'plot_large_investment', label: 'Investment', children: [] },
          ]
        },
      ]
    },
  ]
};

export default function ManageLeadProfiling() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ProfilingConfig>(DEFAULT_REAL_ESTATE_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Fetch existing config
  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['lead-profiling-config', company?.id],
    queryFn: async () => {
      if (!company?.id) return null;

      const { data, error } = await supabase
        .from('lead_profiling_config')
        .select('*')
        .eq('company_id', company.id)
        .eq('industry', 'real_estate')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!company?.id
  });

  useEffect(() => {
    if (existingConfig?.config) {
      setConfig(existingConfig.config as unknown as ProfilingConfig);
    }
  }, [existingConfig]);

  const handleSave = async () => {
    if (!company?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lead_profiling_config')
        .upsert({
          company_id: company.id,
          industry: 'real_estate',
          config: config as any,
        }, {
          onConflict: 'company_id,industry'
        });

      if (error) throw error;

      toast.success('Lead profiling configuration saved!');
      queryClient.invalidateQueries({ queryKey: ['lead-profiling-config'] });
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const findNode = (levels: ProfileLevel[], path: string[]): ProfileLevel | null => {
    if (path.length === 0) return null;

    let current: ProfileLevel | undefined = levels.find(l => l.id === path[0]);
    for (let i = 1; i < path.length && current; i++) {
      current = current.children.find(c => c.id === path[i]);
    }
    return current || null;
  };

  const addItem = (parentPath: string[]) => {
    if (!newItemLabel.trim()) {
      toast.error('Please enter a label');
      return;
    }

    const newId = newItemLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
    const newItem: ProfileLevel = {
      id: newId,
      label: newItemLabel.trim(),
      children: []
    };

    setConfig(prev => {
      const newConfig = { ...prev, levels: [...prev.levels] };

      if (parentPath.length === 0) {
        newConfig.levels.push(newItem);
      } else {
        const addToPath = (levels: ProfileLevel[], path: string[], depth: number): ProfileLevel[] => {
          return levels.map(level => {
            if (level.id === path[depth]) {
              if (depth === path.length - 1) {
                return { ...level, children: [...level.children, newItem] };
              }
              return { ...level, children: addToPath(level.children, path, depth + 1) };
            }
            return level;
          });
        };
        newConfig.levels = addToPath(newConfig.levels, parentPath, 0);
      }

      return newConfig;
    });

    setNewItemLabel('');
    toast.success(`Added "${newItem.label}"`);
  };

  const removeItem = (path: string[]) => {
    if (path.length === 0) return;

    setConfig(prev => {
      const newConfig = { ...prev };

      if (path.length === 1) {
        newConfig.levels = prev.levels.filter(l => l.id !== path[0]);
      } else {
        const removeFromPath = (levels: ProfileLevel[], targetPath: string[], depth: number): ProfileLevel[] => {
          return levels.map(level => {
            if (level.id === targetPath[depth]) {
              if (depth === targetPath.length - 2) {
                return { ...level, children: level.children.filter(c => c.id !== targetPath[targetPath.length - 1]) };
              }
              return { ...level, children: removeFromPath(level.children, targetPath, depth + 1) };
            }
            return level;
          });
        };
        newConfig.levels = removeFromPath(prev.levels, path, 0);
      }

      return newConfig;
    });

    if (selectedPath.join('/').startsWith(path.join('/'))) {
      setSelectedPath([]);
    }
  };

  const renderLevel = (levels: ProfileLevel[], path: string[] = [], depth: number = 0) => {
    return (
      <div className={`space-y-2 ${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
        {levels.map((level) => {
          const currentPath = [...path, level.id];
          const isSelected = selectedPath.join('/') === currentPath.join('/');

          return (
            <div key={level.id}>
              <div
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                  }`}
                onClick={() => setSelectedPath(currentPath)}
              >
                {level.children.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 font-medium">{level.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {level.children.length} sub-options
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(currentPath);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {level.children.length > 0 && renderLevel(level.children, currentPath, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lead Profiling Configuration</h1>
            <p className="text-muted-foreground">
              Define the nested structure for qualifying real estate leads
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tree View */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile Structure</CardTitle>
              <CardDescription>
                Click on an item to add sub-options
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config.levels.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No profiles configured. Add your first category below.
                </div>
              ) : (
                renderLevel(config.levels)
              )}
            </CardContent>
          </Card>

          {/* Add Item Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Option</CardTitle>
              <CardDescription>
                {selectedPath.length === 0
                  ? 'Add a top-level category'
                  : `Add sub-option to: ${findNode(config.levels, selectedPath)?.label || ''}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPath.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedPath.map((id, index) => {
                    const node = findNode(config.levels, selectedPath.slice(0, index + 1));
                    return (
                      <Badge key={id} variant="outline">
                        {node?.label}
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newLabel">Option Label</Label>
                <Input
                  id="newLabel"
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                  placeholder="e.g., 3 BHK or Ready to Move"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addItem(selectedPath);
                    }
                  }}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => addItem(selectedPath)}
                disabled={!newItemLabel.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>

              {selectedPath.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedPath([])}
                >
                  Clear Selection (Add Top-Level)
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              This is how the lead profiling dropdown will appear to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {config.levels.map(level => (
                <Badge key={level.id} variant="secondary" className="text-sm py-1">
                  {level.label}
                  {level.children.length > 0 && ` (${level.children.length})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
