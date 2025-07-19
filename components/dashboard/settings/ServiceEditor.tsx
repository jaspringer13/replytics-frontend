"use client"

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, GripVertical, Edit2, Trash2, DollarSign, Clock, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { realtimeConfigManager } from '@/lib/realtime-config';
import { useToast } from '@/hooks/useToast';
import { Service } from '@/app/models/dashboard';

interface ServiceEditorProps {
  businessId: string;
}

export function ServiceEditor({ businessId }: ServiceEditorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 30,
    price: 0,
    description: '',
    active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    loadServices();

    // Subscribe to real-time updates
    const unsubscribe = realtimeConfigManager.subscribe('service_update', (update) => {
      if (update.businessId === businessId) {
        loadServices();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [businessId]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getServices(true);
      setServices(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(services);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display order
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setServices(updatedItems);

    try {
      await apiClient.reorderServices(updatedItems.map(s => s.id));
      toast.success('Services reordered successfully');
    } catch (error) {
      console.error('Failed to reorder services:', error);
      toast.error('Failed to reorder services');
      loadServices(); // Reload to get correct order
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: '',
      duration: 30,
      price: 0,
      description: '',
      active: true
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      duration: service.duration,
      price: service.price,
      description: service.description || '',
      active: service.active
    });
    setIsDialogOpen(true);
  };

  const handleSaveService = async () => {
    try {
      if (editingService) {
        await apiClient.updateService(editingService.id, formData);
        toast.success('Service updated successfully');
      } else {
        await apiClient.createService({
          ...formData,
          businessId: businessId,
          displayOrder: services.length > 0 ? Math.max(...services.map(s => s.displayOrder)) + 1 : 0
        });
        toast.success('Service created successfully');
      }
      setIsDialogOpen(false);
      loadServices();
    } catch (error) {
      console.error('Failed to save service:', error);
      toast.error('Failed to save service');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await apiClient.deleteService(serviceId);
      toast.success('Service deleted successfully');
      loadServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
      toast.error('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Services</h2>
          <Button onClick={handleAddService} className="bg-brand-500 hover:bg-brand-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No services configured yet</p>
            <Button onClick={handleAddService} variant="outline">
              Add Your First Service
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="services">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {services.map((service, index) => (
                    <Draggable key={service.id} draggableId={service.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-gray-700/50 border border-gray-600 rounded-lg p-4 ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-white">{service.name}</h3>
                                {!service.active && (
                                  <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {service.duration} min
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${service.price}
                                </span>
                              </div>
                              {service.description && (
                                <p className="text-sm text-gray-400 mt-2">{service.description}</p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditService(service)}
                                className="text-gray-400 hover:text-white"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingService ? 'Edit Service' : 'Add Service'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name" className="text-gray-300">Service Name</Label>
              <Input
                id="service-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 bg-gray-700/50 border-gray-600 text-white"
                placeholder="e.g., Haircut"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-duration" className="text-gray-300">Duration (minutes)</Label>
                <Input
                  id="service-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-gray-700/50 border-gray-600 text-white"
                  min="5"
                  step="5"
                />
              </div>

              <div>
                <Label htmlFor="service-price" className="text-gray-300">Price ($)</Label>
                <Input
                  id="service-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="mt-1 bg-gray-700/50 border-gray-600 text-white"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="service-description" className="text-gray-300">Description (optional)</Label>
              <Textarea
                id="service-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 bg-gray-700/50 border-gray-600 text-white"
                placeholder="Brief description of the service"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="service-active" className="text-gray-300">Active</Label>
              <Switch
                id="service-active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveService}
              disabled={!formData.name || formData.duration <= 0 || formData.price < 0}
              className="bg-brand-500 hover:bg-brand-600"
            >
              {editingService ? 'Update' : 'Create'} Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}