/* Place your JavaScript in this file */import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ==================================================================
// Utility Functions & Configuration
// ==================================================================

// Helper to format currency for display (e.g., $5.00)
const formatCurrency = (value) => {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return "$0.00";
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
};

// Helper to format cost per unit, showing more precision (e.g., $0.0160 / g)
const formatCostPerUnit = (value, unit) => {
    const numValue = parseFloat(value);
    // Ensure we display 4 decimal places for accuracy, which is crucial for low-cost items.
    if (isNaN(numValue) || numValue === 0 || !isFinite(numValue)) return `$0.0000 / ${unit}`;
    return `$${numValue.toFixed(4)} / ${unit}`;
};

// Core calculation function for cost per unit
const calculateCostPerUnit = (cost, unit) => {
    const costVal = parseFloat(cost);
    const unitVal = parseFloat(unit);
    // Prevent division by zero or invalid inputs
    if (!costVal || !unitVal || unitVal <= 0) return 0;
    return costVal / unitVal;
};

// Tailwind Color Palette Configuration (Calm greens, blues, and grays)
const colors = {
    primary: 'text-green-600',
    primaryBg: 'bg-green-600',
    primaryHover: 'hover:bg-green-700',
    secondary: 'text-blue-600',
    secondaryBg: 'bg-blue-600',
    secondaryHover: 'hover:bg-blue-700',
};

// Icons (Using SVG for clean visuals)
const IconPlus = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
);
const IconTrash = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);
const IconClose = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);

// ==================================================================
// Initial Data
// ==================================================================

// Data is structured using IDs for robust referencing.
// Costs/units are stored as strings to facilitate controlled inputs in React (allowing intermediate states like "5." or empty strings).
const initialIngredientsData = {
  'i1': { id: 'i1', name: 'Beets', purchaseCost: '3.00', purchaseUnit: '500', unit: 'g' },
  'i2': { id: 'i2', name: 'Strawberries', purchaseCost: '5.50', purchaseUnit: '454', unit: 'g' },
  'i3': { id: 'i3', name: 'Cherries', purchaseCost: '7.00', purchaseUnit: '400', unit: 'g' },
  'i4': { id: 'i4', name: 'Lemons', purchaseCost: '4.00', purchaseUnit: '1000', unit: 'g' },
  'i5': { id: 'i5', name: 'Bananas', purchaseCost: '2.50', purchaseUnit: '1500', unit: 'g' },
  'i6': { id: 'i6', name: 'Organic Spinach', purchaseCost: '8.00', purchaseUnit: '500', unit: 'g' },
  'i7': { id: 'i7', name: 'Broccoli', purchaseCost: '3.50', purchaseUnit: '700', unit: 'g' },
  'i8': { id: 'i8', name: 'Kale', purchaseCost: '6.50', purchaseUnit: '400', unit: 'g' },
  'i9': { id: 'i9', name: 'Blueberries', purchaseCost: '6.00', purchaseUnit: '340', unit: 'g' },
  'i10': { id: 'i10', name: 'Avocado', purchaseCost: '10.00', purchaseUnit: '1000', unit: 'g' },
  'i11': { id: 'i11', name: 'Chia Seeds', purchaseCost: '12.00', purchaseUnit: '500', unit: 'g' },
  'i12': { id: 'i12', name: 'Hemp Seeds', purchaseCost: '15.00', purchaseUnit: '500', unit: 'g' },
  'i13': { id: 'i13', name: 'Coconut Flakes', purchaseCost: '5.00', purchaseUnit: '300', unit: 'g' },
  'i14': { id: 'i14', name: 'Oat Milk', purchaseCost: '4.50', purchaseUnit: '1000', unit: 'ml' },
};

const initialRecipesData = [
  {
    id: 'r1',
    name: 'Berry Basic',
    ingredients: [
      // Amounts are stored as numbers in the final recipe data
      { ingredientId: 'i2', amount: 100 }, // Strawberries
      { ingredientId: 'i9', amount: 50 },  // Blueberries
      { ingredientId: 'i5', amount: 80 }, // Bananas
      { ingredientId: 'i14', amount: 250 }, // Oat Milk
    ]
  },
  {
    id: 'r2',
    name: 'Keto Green God',
    ingredients: [
        { ingredientId: 'i6', amount: 80 }, // Spinach
        { ingredientId: 'i10', amount: 50 }, // Avocado
        { ingredientId: 'i12', amount: 15 }, // Hemp Seeds
        { ingredientId: 'i4', amount: 20 }, // Lemons
        { ingredientId: 'i14', amount: 200 }, // Oat Milk
    ]
  }
];

// ==================================================================
// Components - Column 1: Ingredient Inventory
// ==================================================================

/**
 * IngredientCard: Displays an ingredient in the master list and allows editing cost/unit.
 */
const IngredientCard = React.memo(({ ingredient, updateIngredient, costPerUnit }) => {

    // Handles changes to numeric inputs ensuring only valid formats are accepted
    const handleChange = (field, value) => {
        // Allow clearing the field
        if (value === "") {
             updateIngredient(ingredient.id, { ...ingredient, [field]: "" });
             return;
        }
        
        // Validate input format: Cost allows decimals, Unit allows only integers (based on prompt requirements for grams).
        const regex = field === 'purchaseCost' ? /^\d*\.?\d*$/ : /^\d*$/;
        
        if (regex.test(value)) {
            // Handle the case where the user just types a decimal point for cost
            if (value === "." && field === 'purchaseCost') {
                updateIngredient(ingredient.id, { ...ingredient, [field]: "0." });
                return;
            }
            updateIngredient(ingredient.id, { ...ingredient, [field]: value });
        }
    };

    // Styling for editable input fields, making them clearly distinguished.
    const inputStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-gray-50 transition duration-150";

    return (
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 transition duration-150 hover:shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{ingredient.name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* PurchaseCost Input */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Cost ($)</label>
                    <input
                        type="text" // Use text type for better control over validation and formatting
                        inputMode="decimal" // Hint for mobile keyboards
                        value={ingredient.purchaseCost}
                        onChange={(e) => handleChange('purchaseCost', e.target.value)}
                        className={inputStyle}
                        placeholder="0.00"
                    />
                </div>
                {/* PurchaseUnit Input */}
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Purchase Unit ({ingredient.unit})</label>
                     <input
                        type="text"
                        inputMode="numeric"
                        value={ingredient.purchaseUnit}
                        onChange={(e) => handleChange('purchaseUnit', e.target.value)}
                        className={inputStyle}
                        placeholder="0"
                    />
                </div>
            </div>
            {/* Auto-calculated CostPerGram/ML */}
            <div className="pt-3 border-t border-gray-100 text-right">
                <p className="text-xs font-medium text-gray-600">Cost Per Unit:</p>
                <p className={`text-base font-bold ${colors.secondary}`}>
                    {formatCostPerUnit(costPerUnit, ingredient.unit)}
                </p>
            </div>
        </div>
    );
});

/**
 * AddIngredientForm: Form at the bottom of the inventory column.
 */
const AddIngredientForm = ({ addIngredient }) => {
    const [name, setName] = useState('');
    const [cost, setCost] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('g');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const costVal = parseFloat(cost);
        const amountVal = parseFloat(amount);

        // Basic validation
        if (!name.trim() || isNaN(costVal) || costVal <= 0 || isNaN(amountVal) || amountVal <= 0) {
            alert("Please fill out all fields with valid positive numbers.");
            return;
        }

        const newId = 'i' + Date.now();
        const ingredientToAdd = {
            id: newId,
            name: name.trim(),
            purchaseCost: costVal.toFixed(2), // Store normalized format
            purchaseUnit: amountVal.toString(),
            unit: unit,
        };
        
        // The addIngredient function returns true on success (e.g., if no duplicate)
        if (addIngredient(newId, ingredientToAdd)) {
            // Reset form
            setName('');
            setCost('');
            setAmount('');
            setUnit('g');
        }
    };

    const inputStyle = "block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2";

    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-blue-200 mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Ingredient</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                     <input
                        type="text"
                        placeholder="Ingredient Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputStyle}
                        required
                    />
                </div>
                <div>
                    {/* Standard number input for the form */}
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Cost ($)"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className={inputStyle}
                        required
                    />
                </div>
                 <div className="flex gap-2">
                    <input
                        type="number"
                        step="1"
                        min="1"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                         className={inputStyle}
                        required
                    />
                    <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className={`${inputStyle} bg-white`}
                    >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className={`w-full ${colors.secondaryBg} ${colors.secondaryHover} text-white font-bold py-2 px-4 rounded-lg transition duration-150 ease-in-out shadow-md flex items-center justify-center`}
                >
                    <IconPlus/> <span className="ml-2">Add</span>
                </button>
            </form>
        </div>
    );
};

/**
 * IngredientInventory: The container for Column 1.
 */
const IngredientInventory = ({ ingredients, updateIngredient, addIngredient, ingredientCostMap }) => {
    // Sort ingredients alphabetically for easier browsing
    const sortedIngredients = useMemo(() => {
        return Object.values(ingredients).sort((a, b) => a.name.localeCompare(b.name));
    }, [ingredients]);

    return (
        <div className="p-6 bg-gray-50 rounded-xl shadow-inner h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b">Ingredient Inventory</h2>
            
            {/* Scrollable Area for the list of ingredients */}
            <div className="flex-grow overflow-y-auto pr-4 mb-4">
                <div className="space-y-4">
                    {sortedIngredients.map(ingredient => (
                        <IngredientCard
                            key={ingredient.id}
                            ingredient={ingredient}
                            updateIngredient={updateIngredient}
                            // Pass the pre-calculated cost from the map
                            costPerUnit={ingredientCostMap[ingredient.id] || 0}
                        />
                    ))}
                </div>
            </div>

            <AddIngredientForm addIngredient={addIngredient} />
        </div>
    );
};

// ==================================================================
// Components - Column 2: Recipe Menu & Editor
// ==================================================================

/**
 * RecipeCard: Displays a summary of the recipe in the menu list.
 */
const RecipeCard = ({ recipe, ingredientCostMap, openEditor }) => {
    // Key Feature: Calculate total cost using the derived cost map.
    // This ensures instant updates when ingredient prices change in the master list.
    const totalCost = useMemo(() => {
        return recipe.ingredients.reduce((acc, item) => {
            const costPerUnit = ingredientCostMap[item.ingredientId] || 0;
            const amount = parseFloat(item.amount) || 0;
            return acc + (amount * costPerUnit);
        }, 0);
    }, [recipe, ingredientCostMap]);

    return (
        <div
            className="bg-white p-6 rounded-xl shadow-lg cursor-pointer hover:shadow-xl transition duration-300 ease-in-out border border-green-100 transform hover:-translate-y-1"
            onClick={() => openEditor(recipe)}
        >
            <h3 className="text-xl font-bold text-gray-800 mb-4">{recipe.name}</h3>
            <div className="flex justify-between items-end pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">{recipe.ingredients.length} ingredients</p>
                {/* Total Cost displayed in a larger, bold font */}
                <p className={`text-3xl font-extrabold ${colors.primary}`}>
                    {formatCurrency(totalCost)}
                </p>
            </div>
        </div>
    );
};

/**
 * RecipeEditorModal: Modal interface for creating or editing recipes.
 */
const RecipeEditorModal = ({ isOpen, close, recipe, ingredients, ingredientCostMap, saveRecipe }) => {
    // Local state for the draft recipe being edited
    const [draftRecipe, setDraftRecipe] = useState(recipe);
    // Local state for the "Add Ingredient" form inputs
    const [newIngredientId, setNewIngredientId] = useState('');
    const [newIngredientAmount, setNewIngredientAmount] = useState('');

    // Sync draft recipe when modal opens or a different recipe is selected
    useEffect(() => {
        if (isOpen && recipe) {
            // When opening the editor, ensure ingredient amounts are converted to strings for the draft state inputs
            const recipeWithStrAmounts = {
                ...recipe,
                ingredients: recipe.ingredients.map(ing => ({
                    ...ing,
                    amount: ing.amount.toString()
                }))
            };
            setDraftRecipe(recipeWithStrAmounts);
            // Reset the add form
            setNewIngredientId('');
            setNewIngredientAmount('');
        }
    }, [recipe, isOpen]);

    // Calculate total cost in real-time within the modal using the draft recipe
    const totalCost = useMemo(() => {
        if (!draftRecipe) return 0;
        return draftRecipe.ingredients.reduce((acc, item) => {
            const costPerUnit = ingredientCostMap[item.ingredientId] || 0;
            // Calculate based on the current string value in the draft input
            const amount = parseFloat(item.amount) || 0;
            return acc + (amount * costPerUnit);
        }, 0);
    }, [draftRecipe, ingredientCostMap]);

    if (!isOpen || !draftRecipe) return null;

    const handleNameChange = (e) => {
        setDraftRecipe({ ...draftRecipe, name: e.target.value });
    };

    const handleAmountChange = (index, amountStr) => {
        const newIngredients = [...draftRecipe.ingredients];
        // Allow empty string for better UX, validate numeric input (integers only for amount)
        if (amountStr === "" || /^\d*$/.test(amountStr)) {
             newIngredients[index] = { ...newIngredients[index], amount: amountStr };
             setDraftRecipe({ ...draftRecipe, ingredients: newIngredients });
        }
    };

    const removeIngredient = (index) => {
        const newIngredients = draftRecipe.ingredients.filter((_, i) => i !== index);
        setDraftRecipe({ ...draftRecipe, ingredients: newIngredients });
    };

    const addIngredientToRecipe = (e) => {
        e.preventDefault();
        const amountToAdd = parseFloat(newIngredientAmount);

        if (!newIngredientId || isNaN(amountToAdd) || amountToAdd <= 0) {
            alert("Please select an ingredient and enter a valid positive amount.");
            return;
        }

        // Check if the ingredient is already in the recipe
        const existingIndex = draftRecipe.ingredients.findIndex(ing => ing.ingredientId === newIngredientId);
        let newIngredients = [...draftRecipe.ingredients];

        if (existingIndex > -1) {
            // If exists, add to the existing amount
            const currentAmount = parseFloat(newIngredients[existingIndex].amount) || 0;
            newIngredients[existingIndex].amount = (currentAmount + amountToAdd).toString();
        } else {
            // If new, add it to the list
            newIngredients.push({
                ingredientId: newIngredientId,
                amount: amountToAdd.toString(),
            });
        }

        setDraftRecipe({ ...draftRecipe, ingredients: newIngredients });
        // Reset the form
        setNewIngredientId('');
        setNewIngredientAmount('');
    };

    const handleSave = () => {
        if (!draftRecipe.name.trim()) {
            alert("Recipe must have a name.");
            return;
        }
        
        // Normalize amounts back to numbers and filter out invalid/zero entries before saving
        const finalizedIngredients = draftRecipe.ingredients
            .map(ing => ({
                ...ing,
                // Ensure amount is a valid number, default to 0 if empty string or invalid
                amount: parseFloat(ing.amount) || 0
            }))
            .filter(ing => ing.amount > 0);

        if (finalizedIngredients.length === 0) {
            alert("Recipe must have at least one ingredient with a positive amount.");
            return;
        }

        const finalizedRecipe = {
            ...draftRecipe,
            name: draftRecipe.name.trim(),
            ingredients: finalizedIngredients
        };
        
        saveRecipe(finalizedRecipe);
        close();
    };

    // Prepare sorted list of available ingredients for the dropdown
    const availableIngredients = Object.values(ingredients).sort((a, b) => a.name.localeCompare(b.name));

    return (
        // Modal Backdrop
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
            {/* Modal Content */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-gray-800">Recipe Editor</h2>
                    <button onClick={close} className="text-gray-500 hover:text-gray-800 transition duration-150">
                        <IconClose />
                    </button>
                </header>

                {/* Recipe Name Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipe Name</label>
                    <input
                        type="text"
                        value={draftRecipe.name}
                        onChange={handleNameChange}
                        className="text-xl block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-gray-50"
                        placeholder="e.g., Tropical Paradise"
                    />
                </div>

                <h3 className="text-xl font-semibold mb-4 text-gray-700">Recipe Ingredients</h3>
                
                {/* Scrollable Ingredient List */}
                <div className="space-y-3 mb-6 flex-grow overflow-y-auto pr-2">
                    {draftRecipe.ingredients.length === 0 && <p className="text-gray-500 italic p-4 text-center">No ingredients added yet.</p>}
                    {draftRecipe.ingredients.map((recipeIngredient, index) => {
                        const ingredientData = ingredients[recipeIngredient.ingredientId];
                        // Handle case if ingredient was deleted from master list
                        if (!ingredientData) return (
                             <div key={index} className="bg-red-100 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-red-800">Ingredient data missing (ID: {recipeIngredient.ingredientId})</span>
                                <button onClick={() => removeIngredient(index)} className="text-red-600 hover:text-red-800"><IconTrash/></button>
                            </div>
                        ); 

                        const costPerUnit = ingredientCostMap[recipeIngredient.ingredientId] || 0;
                        const amount = parseFloat(recipeIngredient.amount) || 0;
                        const lineItemCost = costPerUnit * amount;

                        return (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                                {/* Ingredient Name */}
                                <div className="w-1/3 font-medium text-gray-800">{ingredientData.name}</div>
                                
                                {/* AmountInRecipe Input (Editable) */}
                                <div className="flex items-center space-x-3 w-1/3 justify-center">
                                    <label className="text-sm text-gray-600">Amount:</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={recipeIngredient.amount}
                                        onChange={(e) => handleAmountChange(index, e.target.value)}
                                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 text-right bg-white"
                                        placeholder="0"
                                    />
                                    <span className="text-sm text-gray-500">{ingredientData.unit}</span>
                                </div>

                                {/* LineItemCost (Auto-calculated) */}
                                <div className="w-1/4 text-right">
                                     <label className="text-sm text-gray-600">Line Cost:</label>
                                     <span className={`font-semibold ${colors.primary} ml-2`}>
                                        {formatCurrency(lineItemCost)}
                                    </span>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeIngredient(index)}
                                    className="ml-4 text-red-500 hover:text-red-700 transition duration-150"
                                    title="Remove Ingredient"
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Add Ingredient to Recipe Form */}
                <div className="bg-blue-50 p-5 rounded-lg shadow-inner mb-8">
                    <h4 className="text-lg font-semibold mb-3 text-blue-800">Add Ingredient to Recipe</h4>
                    <form onSubmit={addIngredientToRecipe} className="flex gap-4">
                        <select
                            value={newIngredientId}
                            onChange={(e) => setNewIngredientId(e.target.value)}
                            className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white"
                            required
                        >
                            <option value="">Select Ingredient</option>
                            {availableIngredients.map(ing => (
                                <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            step="1"
                            min="1"
                            placeholder="Amount"
                            value={newIngredientAmount}
                            onChange={(e) => setNewIngredientAmount(e.target.value)}
                            className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 bg-white"
                            required
                        />
                        <button
                            type="submit"
                            className={`${colors.secondaryBg} ${colors.secondaryHover} text-white font-bold py-2 px-5 rounded-md transition duration-150 shadow-md`}
                        >
                            Add
                        </button>
                    </form>
                </div>

                {/* Footer: Total Cost and Actions */}
                <footer className="flex justify-between items-center pt-6 border-t border-gray-200">
                    {/* Conspicuous Total Cost display */}
                    <div>
                         <p className="text-sm font-medium text-gray-500">Total Recipe Cost</p>
                        <div className={`text-4xl font-bold ${colors.primary}`}>
                           {formatCurrency(totalCost)}
                        </div>
                    </div>
                    <div className="space-x-4">
                        <button
                            onClick={close}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-150 shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className={`${colors.primaryBg} ${colors.primaryHover} text-white font-bold py-3 px-8 rounded-lg transition duration-150 shadow-md`}
                        >
                            Save Recipe
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

/**
 * RecipeMenu: The container for Column 2.
 */
const RecipeMenu = ({ recipes, ingredients, ingredientCostMap, updateRecipes }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecipe, setCurrentRecipe] = useState(null);

    const openEditor = (recipe) => {
        setCurrentRecipe(recipe);
        setIsModalOpen(true);
    };

    const createNewRecipe = () => {
        const newRecipe = {
            id: 'r' + Date.now(),
            name: '',
            ingredients: [],
        };
        openEditor(newRecipe);
    };

    const saveRecipe = (savedRecipe) => {
        const existingIndex = recipes.findIndex(r => r.id === savedRecipe.id);
        const newRecipes = [...recipes];

        if (existingIndex > -1) {
            // Update existing recipe
            newRecipes[existingIndex] = savedRecipe;
        } else {
            // Add new recipe
            newRecipes.push(savedRecipe);
        }
        updateRecipes(newRecipes);
    };

    return (
        <div className="p-6 rounded-xl shadow-lg bg-white h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-2 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Smoothie Recipes</h2>
                <button
                    onClick={createNewRecipe}
                    className={`${colors.primaryBg} ${colors.primaryHover} text-white font-bold py-2 px-5 rounded-lg shadow-md transition duration-150 flex items-center`}
                >
                    <IconPlus/> <span className="ml-2">Create New Recipe</span>
                </button>
            </div>

            {/* Scrollable Area for the recipe list */}
            <div className="flex-grow overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recipes.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            ingredientCostMap={ingredientCostMap}
                            openEditor={openEditor}
                        />
                    ))}
                </div>
            </div>

            <RecipeEditorModal
                isOpen={isModalOpen}
                close={() => setIsModalOpen(false)}
                recipe={currentRecipe}
                ingredients={ingredients}
                ingredientCostMap={ingredientCostMap}
                saveRecipe={saveRecipe}
            />
        </div>
    );
};

// ==================================================================
// Main App Component
// ==================================================================

const SmoothieScribe = () => {
    // Central state management
    const [ingredients, setIngredients] = useState(initialIngredientsData);
    const [recipes, setRecipes] = useState(initialRecipesData);

    // Optimization & Core Feature: Centralized calculation of all ingredient costs.
    // This useMemo creates a map (ID -> CostPerUnit) and ensures it is only recalculated
    // when the 'ingredients' state changes. This map is the source of truth for pricing used throughout the app.
    const ingredientCostMap = useMemo(() => {
        const costs = {};
        Object.values(ingredients).forEach(ing => {
            costs[ing.id] = calculateCostPerUnit(ing.purchaseCost, ing.purchaseUnit);
        });
        return costs;
    }, [ingredients]);

    const updateIngredient = useCallback((id, updatedData) => {
        setIngredients(prevIngredients => ({
            ...prevIngredients,
            [id]: updatedData
        }));
    }, []);

    const addIngredient = useCallback((id, newData) => {
        // Prevent duplicate ingredient names (case-insensitive)
        const duplicate = Object.values(ingredients).find(ing => ing.name.toLowerCase() === newData.name.toLowerCase());
        if (duplicate) {
            alert(`Ingredient "${newData.name}" already exists. Please update the existing entry.`);
            return false; // Indicate failure
        }
         setIngredients(prevIngredients => ({
            ...prevIngredients,
            [id]: newData
        }));
        return true; // Indicate success
    }, [ingredients]);

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">
            <header className="bg-white shadow-md p-6 mb-8 border-b-4 border-green-500">
                <div className="container mx-auto">
                    <h1 className="text-4xl font-black text-gray-800">Smoothie Scribe</h1>
                    <p className="text-gray-600 mt-1">Recipe & Cost Calculator</p>
                </div>
            </header>

            <main className="container mx-auto px-4 pb-8">
                {/* Main layout: Two side-by-side columns (stacked on mobile) */}
                {/* We set a max height on large screens to enable internal scrolling within the columns if content overflows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Column 1: Ingredient Inventory */}
                    {/* The height calculation ensures the columns fit nicely below the header on large screens */}
                    <div className="lg:h-[calc(100vh-150px)]">
                        <IngredientInventory
                            ingredients={ingredients}
                            updateIngredient={updateIngredient}
                            addIngredient={addIngredient}
                            ingredientCostMap={ingredientCostMap}
                        />
                    </div>

                    {/* Column 2: Recipe Menu */}
                    <div className="lg:h-[calc(100vh-150px)]">
                        <RecipeMenu
                            recipes={recipes}
                            ingredients={ingredients}
                            ingredientCostMap={ingredientCostMap}
                            updateRecipes={setRecipes}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SmoothieScribe;