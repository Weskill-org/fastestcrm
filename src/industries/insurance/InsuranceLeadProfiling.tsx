import { useState, useEffect } from 'react';
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

const DEFAULT_INSURANCE_CONFIG: ProfilingConfig = {
  levels: [
    {
      id: 'life_insurance', label: 'Life Insurance',
      children: [
        { id: 'term_insurance', label: 'Term Insurance', children: [
          { id: 'term_50l', label: '< 50 Lakh', children: [] },
          { id: 'term_50l_1cr', label: '50L - 1 Cr', children: [] },
          { id: 'term_1cr_plus', label: '1 Cr+', children: [] },
        ]},
        { id: 'ulip', label: 'ULIP', children: [
          { id: 'ulip_short', label: 'Short Term (5-10 yrs)', children: [] },
          { id: 'ulip_long', label: 'Long Term (15+ yrs)', children: [] },
        ]},
        { id: 'endowment', label: 'Endowment', children: [] },
      ]
    },
    {
      id: 'health_insurance', label: 'Health Insurance',
      children: [
        { id: 'individual', label: 'Individual', children: [
          { id: 'health_5l', label: '< 5 Lakh', children: [] },
          { id: 'health_5_10l', label: '5-10 Lakh', children: [] },
          { id: 'health_10l_plus', label: '10 Lakh+', children: [] },
        ]},
        { id: 'family_floater', label: 'Family Floater', children: [] },
        { id: 'senior_citizen', label: 'Senior Citizen', children: [] },
      ]
    },
    {
      id: 'motor_insurance', label: 'Motor Insurance',
      children: [
        { id: 'comprehensive', label: 'Comprehensive', children: [] },
        { id: 'third_party', label: 'Third Party', children: [] },
      ]
    },
  ]
};

export default function InsuranceLeadProfiling() {
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<ProfilingConfig>(DEFAULT_INSURANCE_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const { data: existingConfig, isLoading } = useQuery({
    queryKey: ['lead-profiling-config', company?.id, 'insurance'],
    queryFn: async () => {
      if (!company?.id) return null;
      const { data, error } = await supabase
        .from('lead_profiling_config')
        .select('*')
        .eq('company_id', company.id)
        .eq('industry', 'insurance')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!company?.id
  });

  useEffect(() => {
    if (existingConfig?.config) setConfig(existingConfig.config as unknown as ProfilingConfig);
  }, [existingConfig]);

  const handleSave = async () => {
    if (!company?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('lead_profiling_config').upsert({
        company_id: company.id, industry: 'insurance', config: config as any,
      }, { onConflict: 'company_id,industry' });
      if (error) throw error;
      toast.success('Configuration saved!');
      queryClient.invalidateQueries({ queryKey: ['lead-profiling-config'] });
    } catch { toast.error('Failed to save'); } finally { setIsSaving(false); }
  };

  const findNode = (levels: ProfileLevel[], path: string[]): ProfileLevel | null => {
    if (path.length === 0) return null;
    let current: ProfileLevel | undefined = levels.find(l => l.id === path[0]);
    for (let i = 1; i < path.length && current; i++) current = current.children.find(c => c.id === path[i]);
    return current || null;
  };

  const addItem = (parentPath: string[]) => {
    if (!newItemLabel.trim()) { toast.error('Please enter a label'); return; }
    const newItem: ProfileLevel = { id: newItemLabel.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(), label: newItemLabel.trim(), children: [] };
    setConfig(prev => {
      const nc = { ...prev, levels: [...prev.levels] };
      if (parentPath.length === 0) { nc.levels.push(newItem); } else {
        const addToPath = (levels: ProfileLevel[], path: string[], depth: number): ProfileLevel[] =>
          levels.map(level => level.id === path[depth]
            ? depth === path.length - 1
              ? { ...level, children: [...level.children, newItem] }
              : { ...level, children: addToPath(level.children, path, depth + 1) }
            : level);
        nc.levels = addToPath(nc.levels, parentPath, 0);
      }
      return nc;
    });
    setNewItemLabel('');
  };

  const removeItem = (path: string[]) => {
    if (path.length === 0) return;
    setConfig(prev => {
      const nc = { ...prev };
      if (path.length === 1) { nc.levels = prev.levels.filter(l => l.id !== path[0]); } else {
        const rem = (levels: ProfileLevel[], tp: string[], d: number): ProfileLevel[] =>
          levels.map(level => level.id === tp[d]
            ? d === tp.length - 2
              ? { ...level, children: level.children.filter(c => c.id !== tp[tp.length - 1]) }
              : { ...level, children: rem(level.children, tp, d + 1) }
            : level);
        nc.levels = rem(prev.levels, path, 0);
      }
      return nc;
    });
    if (selectedPath.join('/').startsWith(path.join('/'))) setSelectedPath([]);
  };

  const renderLevel = (levels: ProfileLevel[], path: string[] = [], depth: number = 0) => (
    <div className={`space-y-2 ${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      {levels.map((level) => {
        const currentPath = [...path, level.id];
        const isSelected = selectedPath.join('/') === currentPath.join('/');
        return (
          <div key={level.id}>
            <div className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`} onClick={() => setSelectedPath(currentPath)}>
              {level.children.length > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <span className="flex-1 font-medium">{level.label}</span>
              <Badge variant="secondary" className="text-xs">{level.children.length} sub</Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeItem(currentPath); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
            {level.children.length > 0 && renderLevel(level.children, currentPath, depth + 1)}
          </div>
        );
      })}
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Insurance Lead Profiling</h1>
          <p className="text-muted-foreground">Define the nested structure for qualifying insurance leads</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Configuration
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Profile Structure</CardTitle><CardDescription>Click on an item to add sub-options</CardDescription></CardHeader>
          <CardContent>{config.levels.length === 0 ? <div className="text-center py-8 text-muted-foreground">No profiles configured.</div> : renderLevel(config.levels)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Add New Option</CardTitle><CardDescription>{selectedPath.length === 0 ? 'Add a top-level category' : `Add sub-option to: ${findNode(config.levels, selectedPath)?.label || ''}`}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {selectedPath.length > 0 && <div className="flex flex-wrap gap-1">{selectedPath.map((id, index) => { const node = findNode(config.levels, selectedPath.slice(0, index + 1)); return <Badge key={id} variant="outline">{node?.label}</Badge>; })}</div>}
            <div className="space-y-2"><Label>Option Label</Label><Input value={newItemLabel} onChange={(e) => setNewItemLabel(e.target.value)} placeholder="e.g., Term Insurance" onKeyDown={(e) => { if (e.key === 'Enter') addItem(selectedPath); }} /></div>
            <Button className="w-full" onClick={() => addItem(selectedPath)} disabled={!newItemLabel.trim()}><Plus className="h-4 w-4 mr-2" /> Add Option</Button>
            {selectedPath.length > 0 && <Button variant="outline" className="w-full" onClick={() => setSelectedPath([])}>Clear Selection</Button>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
