import React, { useState, useEffect } from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, increment } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const Bookingpage = () => {
    const auth = getAuth();
    const [showLogout, setShowLogout] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [bookings, setBookings] = useState([]);
    const [vacations, setVacations] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phoneNumber: '',
        destination: '',
        quota: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const itemsPerPage = 10;

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const user = auth.currentUser;
            
            if (!user) {
                navigate('/login');
                return;
            }

            const bookingsQuery = query(
                collection(db, 'users', user.uid, 'bookings')
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setBookings(bookingsData);

            const vacationsRef = collection(db, 'users', user.uid, 'vacations');
            const vacationsSnapshot = await getDocs(vacationsRef);
            
            const vacationsData = vacationsSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    city: data.city || 'Unknown',
                    quota: Number(data.quota) || 0,
                    price: data.price || '0',
                    country: data.country || ''
                };
            });
            
            setVacations(vacationsData);
            
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchData();
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredData = bookings.filter(booking =>
        booking.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.phoneNumber?.toString().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this booking?")) {
            try {
                const user = auth.currentUser;
                const bookingToDelete = bookings.find(b => b.id === id);
                
                if (bookingToDelete?.vacationId) {
                    const vacationRef = doc(db, 'users', user.uid, 'vacations', bookingToDelete.vacationId);
                    await updateDoc(vacationRef, {
                        quota: increment(1)
                    });
                }

                await deleteDoc(doc(db, 'users', user.uid, 'bookings', id));
                fetchData();
            } catch (error) {
                console.error('Error deleting booking:', error);
            }
        }
    };

    const handleAddOrEditBooking = async (e) => {
        e.preventDefault();

        const user = auth.currentUser;
        if (!user) return;

        if (!formData.name || !formData.phoneNumber || !formData.destination) {
            alert("Please fill all required fields");
            return;
        }

        const selectedVacation = vacations.find(v => v.city === formData.destination);
        if (!selectedVacation) return;

        const availableQuota = Number(selectedVacation.quota);
        if (availableQuota <= 0) {
            alert("No available quota for this destination");
            return;
        }

        try {
            if (isEditing) {
                await updateDoc(doc(db, 'users', user.uid, 'bookings', editingId), formData);
            } else {
                await updateDoc(doc(db, 'users', user.uid, 'vacations', selectedVacation.id), {
                    quota: availableQuota - 1
                });

                await addDoc(collection(db, 'users', user.uid, 'bookings'), {
                    ...formData,
                    vacationId: selectedVacation.id,
                    destinationCountry: selectedVacation.country,
                    destinationPrice: selectedVacation.price
                });
            }

            setFormData({ name: '', phoneNumber: '', destination: '', quota: 0 });
            setIsEditing(false);
            setEditingId(null);
            setShowForm(false);
            fetchData();
        } catch (error) {
            console.error("Error processing booking:", error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <aside className="w-50 bg-white p-6 shadow-md">
                <div className='flex flex-row gap-1 mb-10'>
                    <h3 className='text-h3 text-primary-black font-bold'>Trabook</h3>
                    <img src='/assets/logo.svg' alt='logo' />
                </div>
                <nav className="space-y-4 text-gray-700 font-medium">
                    <button className="block hover:text-orange-500 transition duration-300" onClick={() => navigate('/dest')}>Manage Destination</button>
                    <button className="block hover:text-orange-500 transition duration-300" onClick={() => navigate('/vac')}>Manage Vacation Plan</button>
                    <button className="block hover:text-orange-500 transition duration-300" onClick={() => navigate('/usr')}>Manage User</button>
                    <button className="block hover:text-orange-500 transition duration-300" onClick={() => navigate('/book')}>Manage Booking</button>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                <div className="flex justify-between items-center mb-6 border-b-2 pb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Manage Bookings</h2>
                    <div className="relative">
                        <button onClick={() => setShowLogout(!showLogout)} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full">
                            <span className="text-gray-800">Profile</span>
                        </button>
                        {showLogout && (
                            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md border">
                                <button onClick={() => {
                                    localStorage.removeItem('user');
                                    navigate('/login');
                                }} className="px-4 py-2 text-red-500 hover:bg-red-100 w-full text-left">
                                    <FiLogOut className="inline mr-2" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 text-red-800 rounded">
                        {error}
                        <button onClick={fetchData} className="ml-4 px-3 py-1 bg-red-600 text-white rounded">
                            Retry
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 w-1/3">
                        <FiSearch className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name or phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => setShowForm(true)} 
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                        disabled={vacations.length === 0}
                    >
                        <FaPlus />
                        Add
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-auto rounded-lg shadow bg-white">
                            <table className="min-w-full text-left text-sm text-gray-700">
                                <thead className="bg-gray-100 text-gray-600 font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Name</th>
                                        <th className="px-6 py-3">Phone</th>
                                        <th className="px-6 py-3">Destination</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-3">{item.name}</td>
                                                <td className="px-6 py-3">{item.phoneNumber}</td>
                                                <td className="px-6 py-3">
                                                    {item.destination}
                                                    {item.destinationCountry && `, ${item.destinationCountry}`}
                                                </td>
                                                <td className="px-6 py-3">
                                                    <button 
                                                        onClick={() => {
                                                            setFormData({
                                                                name: item.name,
                                                                phoneNumber: item.phoneNumber,
                                                                destination: item.destination,
                                                                quota: item.quota
                                                            });
                                                            setEditingId(item.id);
                                                            setIsEditing(true);
                                                            setShowForm(true);
                                                        }} 
                                                        className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 mr-2"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-700"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                                {searchQuery ? 'No matching bookings' : 'No bookings available'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-6">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700 flex items-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages || totalPages === 0}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}

                {showForm && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-gray-200/40 flex justify-center items-center">
                        <form onSubmit={handleAddOrEditBooking} className="bg-white p-6 rounded-lg shadow-md w-1/3">
                            <h3 className="text-xl font-semibold mb-4">{isEditing ? "Edit" : "Add"} Booking</h3>

                            <div className="mb-4">
                                <label className="block mb-2">
                                    Name
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        required
                                    />
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2">
                                    Phone Number
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        required
                                    />
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2">
                                    Destination
                                    <select
                                        name="destination"
                                        value={formData.destination}
                                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded"
                                        required
                                    >
                                        <option value="">Select Destination</option>
                                        {vacations.map((vacation) => (
                                            <option
                                                key={vacation.id}
                                                value={vacation.city}
                                                disabled={vacation.quota <= 0}
                                            >
                                                {vacation.city} ({vacation.quota} available)
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="flex justify-end mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowForm(false);
                                        setFormData({ name: '', phoneNumber: '', destination: '', quota: 0 });
                                        setIsEditing(false);
                                        setEditingId(null);
                                    }} 
                                    className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition mr-2"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
                                >
                                    {isEditing ? 'Update' : 'Add'} Booking
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Bookingpage;