/* eslint-disable react/prop-types */
import { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { useCart } from '../components/CartContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';
import idl from '../idl/product_purchase.json'; // Make sure to generate and import the IDL

function BackButton() {
    return (
        <button
            className="bg-white p-2 rounded-lg shadow-md"
            onClick={() => window.history.back()} // Functionality to go back in history
        >
            <ChevronLeft className="h-5 w-5" />
        </button>
    );
}

// Component to render each cart item
const CartItem = ({ item, removeItem }) => {
    return (
        <div className="flex items-center bg-white rounded-xl p-4 shadow-md">
            <div className={`w-16 h-16 ${item.color} rounded-md mr-4 overflow-hidden`}>
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
                <h2 className="font-semibold text-sm">{item.title}</h2>
                <p className="text-[#f97316] font-bold text-sm">{item.price}</p>
            </div>
            <button className="h-6 w-6 p-0" onClick={removeItem}>
                <Trash2 className="h-4 w-4 text-gray-400" />
            </button>
        </div>
    );
};

// Component to render the pricing summary
const PricingSummary = ({ total }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md space-y-2 text-sm">
            <div className="flex justify-between font-bold">
                <span>Bag Total</span>
                <span>{total.toFixed(3)} SOL</span>
            </div>
        </div>
    );
};

export default function CheckoutPage() {
    const { cartItems, removeFromCart } = useCart();
    const wallet = useWallet();
    const [isProcessing, setIsProcessing] = useState(false);
    const PROGRAM_ID = new PublicKey("8UdsEm4zTw7RScPtuxsmRdLntSKJosvh9CkkveUgRxTu");

    const getProvider = () => {
        const connection = new Connection("https://api.devnet.solana.com");
        const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
        return provider;
    };

    const handleCheckout = async () => {
        if (!wallet.connected) {
            alert("Please connect your wallet first!");
            return;
        }

        setIsProcessing(true);

        try {
            const provider = getProvider();
            const program = new Program(idl, PROGRAM_ID, provider);

            console.log('Cart Items: ', cartItems);
            for (const item of cartItems) {
                console.log('I am here')
                console.log('Item: ', item)
                console.log("Product ID:", item.id); // Ensure this is a valid Solana address
                console.log("Program ID:", program.programId.toString()); // Ensure this is the correct program ID
                const [productPDA] = await PublicKey.findProgramAddress(
                    [Buffer.from("product"), Buffer.from(item.id.toString())],
                    program.programId
                );

                console.log('Product PDA: ', productPDA)
                console.log('Product PDA: ', productPDA.toString())
                console.log(new PublicKey('D52fzjcKYLWfeGzVcwwyLzTqP1MEpHxb4giS2MNoAeZQ'))
                console.log(new PublicKey('D52fzjcKYLWfeGzVcwwyLzTqP1MEpHxb4giS2MNoAeZQ').toString)
                // Call the purchase_product method
                await program.methods.purchaseProduct()
                    .accounts({
                        buyer: wallet.publicKey,
                        seller: new PublicKey('D52fzjcKYLWfeGzVcwwyLzTqP1MEpHxb4giS2MNoAeZQ'), // Ensure you have sellerId in item
                        product: productPDA.toString(),
                        systemProgram: web3.SystemProgram.programId,
                    })
                    .rpc();
            }

            alert("Purchase successful!");
            // Clear the cart or update the UI as needed
        } catch (error) {
            console.error("Error during checkout:", error);
            alert("An error occurred during checkout. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
    const gasPrice = 0.0997; // Example gas price
    const total = subtotal + gasPrice; // Total including gas price

    return (
        <div className="min-h-screen bg-[#f5e6d3] text-gray-800 p-4 max-w-md mx-auto font-sans">
            <BackButton />

            <main className="space-y-4 mb-24">
                {cartItems.map(item => (
                    <CartItem
                        key={item.id}
                        item={item}
                        removeItem={() => removeFromCart(item.id)}
                    />
                ))}
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 space-y-4 shadow-lg">
                <PricingSummary total={total} />
                <button 
                    className="w-full bg-[#f97316] text-white py-4 text-lg font-semibold rounded-3xl shadow-md"
                    onClick={handleCheckout}
                    disabled={isProcessing || !wallet.connected}
                >
                    {isProcessing ? "Processing..." : "Proceed To Checkout"}
                </button>
            </div>
        </div>
    );
}
