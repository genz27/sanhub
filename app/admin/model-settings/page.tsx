'use client';

import { useState, useEffect } from 'react';
import { Loader2, Save, Image, Video } from 'lucide-react';
import { toast } from '@/components/ui/toaster';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/model-config';
import type { ModelDisabledConfig } from '@/types';

export default function ModelSettingsPage() {
  const [disabledModels, setDisabledModels] = useState<ModelDisabledConfig>({
    imageModels: [],
    videoModels: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setDisabledModels(data.data.disabledModels || { imageModels: [], videoModels: [] });
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabledModels }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast({ title: '模型配置已保存' });
    } catch (err) {
      toast({ title: '保存失败', description: err instanceof Error ? err.message : '未知错误', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleImageModel = (modelId: string) => {
    setDisabledModels(prev => ({
      ...prev,
      imageModels: prev.imageModels.includes(modelId)
        ? prev.imageModels.filter(id => id !== modelId)
        : [...prev.imageModels, modelId],
    }));
  };

  const toggleVideoModel = (modelId: string) => {
    setDisabledModels(prev => ({
      ...prev,
      videoModels: prev.videoModels.includes(modelId)
        ? prev.videoModels.filter(id => id !== modelId)
        : [...prev.videoModels, modelId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extralight text-white">模型管理</h1>
          <p className="text-white/50 mt-1 font-light text-sm sm:text-base">启用或禁用单个模型</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存
        </button>
      </div>

      {/* Image Models */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Image className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-medium text-white">图像生成模型</h2>
        </div>
        <div className="p-4 space-y-2">
          {IMAGE_MODELS.map(model => {
            const isDisabled = disabledModels.imageModels.includes(model.id);
            return (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{model.name}</p>
                  <p className="text-white/40 text-sm">{model.description} · {model.provider}</p>
                </div>
                <button
                  onClick={() => toggleImageModel(model.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    !isDisabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      !isDisabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Models */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="font-medium text-white">视频生成模型</h2>
        </div>
        <div className="p-4 space-y-2">
          {VIDEO_MODELS.map(model => {
            const isDisabled = disabledModels.videoModels.includes(model.id);
            return (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{model.name}</p>
                  <p className="text-white/40 text-sm">{model.description} · {model.provider}</p>
                </div>
                <button
                  onClick={() => toggleVideoModel(model.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    !isDisabled ? 'bg-green-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      !isDisabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
