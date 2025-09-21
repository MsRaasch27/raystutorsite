"use client";

import { useState } from "react";

interface CreatureSelectionScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCreature: (creatureId: string) => void;
  isLoading?: boolean;
}

const creatures = [
  {
    id: "creature1",
    image: "/creature1.png"
  },
  {
    id: "creature2", 
    image: "/creature2.png"
  },
  {
    id: "creature3",
    image: "/creature3.png"
  }
];

export default function CreatureSelectionScreen({ isOpen, onClose, onSelectCreature, isLoading = false }: CreatureSelectionScreenProps) {
  const [selectedCreature, setSelectedCreature] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = (creatureId: string) => {
    setSelectedCreature(creatureId);
    onSelectCreature(creatureId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 my-8 overflow-hidden"
        style={{ backgroundImage: 'url(/familiarframe.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
      >
        {/* Header */}
        <div className="p-6 text-center" style={{ backgroundColor: '#775545' }}>  
          <h2 className="text-3xl font-bold mb-2 text-white">Choose Your Animal Familiar</h2>
          <p className="text-gray-200">
            Select the magical creature that will accompany you on your learning journey
          </p>
        </div>

        {/* Content */}
        <div className="p-6">

          {/* Creature Images */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 mt-8">
            {creatures.map((creature) => (
              <div
                key={creature.id}
                className={`relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  selectedCreature === creature.id ? 'ring-4 ring-opacity-75' : ''
                }`}
                style={{
                  '--tw-ring-color': selectedCreature === creature.id ? '#775545' : 'transparent'
                } as React.CSSProperties}
                onClick={() => setSelectedCreature(creature.id)}
              >
                <div className="text-center">
                  <div className="w-40 h-40 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                    <img
                      src={creature.image}
                      alt={`Creature ${creature.id}`}
                      className="w-36 h-36 object-contain"
                      onError={(e) => {
                        // Fallback to emoji if image doesn't exist
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="text-4xl">🦄</div>';
                      }}
                    />
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedCreature === creature.id && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#775545' }}>
                      <span className="text-white text-sm">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Magical elements */}
          <div className="flex justify-center space-x-4 mb-6">
            <div className="text-2xl animate-pulse">✨</div>
            <div className="text-2xl animate-pulse" style={{ animationDelay: '0.2s' }}>🌟</div>
            <div className="text-2xl animate-pulse" style={{ animationDelay: '0.4s' }}>✨</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg transition-colors"
            style={{ 
              borderColor: '#775545', 
              color: '#775545',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#775545';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#775545';
            }}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={() => selectedCreature && handleSelect(selectedCreature)}
            disabled={!selectedCreature || isLoading}
            className="flex-1 px-4 py-2 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: '#775545', 
              color: 'white'
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#5a3f33';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#775545';
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Selecting...
              </div>
            ) : (
              'Choose Familiar! ✨'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
