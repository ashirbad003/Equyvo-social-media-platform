import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Palette, Image, RotateCcw, Upload } from 'lucide-react';
import { useChatTheme, ChatTheme } from '@/contexts/ChatThemeContext';

interface ChatThemeSelectorProps {
  children: React.ReactNode;
}

export function ChatThemeSelector({ children }: ChatThemeSelectorProps) {
  const { chatTheme, setChatTheme, resetChatTheme } = useChatTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(chatTheme.value || '#3b82f6');
  const [opacity, setOpacity] = useState(chatTheme.opacity || 1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setChatTheme({
      type: 'color',
      value: color,
      opacity
    });
  };

  const handleOpacityChange = (newOpacity: number[]) => {
    const newOpacityValue = newOpacity[0];
    setOpacity(newOpacityValue);
    setChatTheme({
      type: chatTheme.type,
      value: chatTheme.value,
      opacity: newOpacityValue
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setChatTheme({
          type: 'image',
          value: imageUrl,
          opacity
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    resetChatTheme();
    setSelectedColor('#3b82f6');
    setOpacity(1);
  };

  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Chat Theme
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="color" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="color">Color</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="color" className="space-y-4">
            <div className="space-y-2">
              <Label>RGB Color Picker</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-16 h-10 p-1 border rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Preset Colors</Label>
              <div className="grid grid-cols-8 gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Opacity: {opacity.toFixed(2)}</Label>
              <Slider
                value={[opacity]}
                onValueChange={handleOpacityChange}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="image" className="space-y-4">
            <div className="space-y-2">
              <Label>Upload Background Image</Label>
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload an image or GIF for chat background
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  Choose File
                </Button>
              </div>
            </div>

            {chatTheme.type === 'image' && chatTheme.value && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={chatTheme.value}
                    alt="Chat background preview"
                    className="w-full h-32 object-cover"
                    style={{ opacity }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Opacity: {opacity.toFixed(2)}</Label>
              <Slider
                value={[opacity]}
                onValueChange={handleOpacityChange}
                max={1}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Current Theme</Label>
                <span className="text-sm text-muted-foreground capitalize">
                  {chatTheme.type}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Opacity</Label>
                <span className="text-sm text-muted-foreground">
                  {opacity.toFixed(2)}
                </span>
              </div>

              {chatTheme.value && (
                <div className="flex items-center justify-between">
                  <Label>Preview</Label>
                  {chatTheme.type === 'color' ? (
                    <div
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: chatTheme.value }}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Image set</span>
                  )}
                </div>
              )}
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
