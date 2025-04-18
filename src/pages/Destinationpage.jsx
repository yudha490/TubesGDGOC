import React, { useState, useEffect } from 'react';
import { FiSearch, FiLogOut } from 'react-icons/fi';
import { FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase-config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const Destinationpage = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [showLogout, setShowLogout] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [destinations, setDestinations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    city: '',
    price: '',
    discount: '',
    country: '',
    rating: '',
    quota: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const querySnapshot = await getDocs(collection(db, 'users', user.uid, 'destinations'));
        const fetchedData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDestinations(fetchedData);
      }
    } catch (error) {
      console.error("Error fetching destinations: ", error);
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

  const filteredData = destinations.filter(destination =>
    destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    destination.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleLogout = () => setShowLogout(!showLogout);
  const toggleForm = () => setShowForm(!showForm);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteDoc(doc(db, 'users', user.uid, 'destinations', id));
        alert("Destination deleted successfully");
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting document: ', error);
    }
  };

  const handleAddOrEditDestination = async (e) => {
    e.preventDefault();

    if (!formData.city || !formData.price || !formData.discount || !formData.country || !formData.rating || !formData.quota) {
      alert("Please fill in all the fields");
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        if (isEditing) {
          await updateDoc(doc(db, 'users', user.uid, 'destinations', editingId), formData);
          alert("Destination updated successfully");
        } else {
          await addDoc(collection(db, 'users', user.uid, 'destinations'), formData);
          alert("Destination added successfully");
        }

        setFormData({
          city: '',
          price: '',
          discount: '',
          country: '',
          rating: '',
          quota: '',
        });
        setIsEditing(false);
        setEditingId(null);
        setShowForm(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error adding or editing document: ', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      city: '',
      price: '',
      discount: '',
      country: '',
      rating: '',
      quota: '',
    });
  };

  const handleEdit = (id) => {
    const destinationToEdit = destinations.find(dest => dest.id === id);
    setFormData(destinationToEdit);
    setEditingId(id);
    setIsEditing(true);
    setShowForm(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-50 bg-white p-6 shadow-md">
        <div className='flex flex-row gap-1 mb-10'>
          <h3 className='text-h3 text-primary-black font-bold'>Trabook</h3>
          <img src='/assets/logo.svg' alt='logo' />
        </div>
        <nav className="space-y-4 text-gray-700 font-medium">
          <button className="block hover:text-orange-500 transition duration-300 text-animate" onClick={() => navigate('/dest')}>Manage Destination</button>
          <button className="block hover:text-orange-500 transition duration-300 text-animate" onClick={() => navigate('/vac')}>Manage Vacation Plan</button>
          <button className="block hover:text-orange-500 transition duration-300 text-animate" onClick={() => navigate('/usr')}>Manage User</button>
          <button className="block hover:text-orange-500 transition duration-300 text-animate" onClick={() => navigate('/book')}>Manage Booking</button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6 border-b-2 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Manage Destination</h2>
          <div className="relative">
            <button onClick={toggleLogout} className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 p-2 rounded-full">
              <span className="text-gray-800">Profile</span>
            </button>
            {showLogout && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md border">
                <button onClick={handleLogout} className="px-4 py-2 text-red-500 hover:bg-red-100 w-full text-left">
                  <FiLogOut className="inline mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 w-1/3">
            <FiSearch className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by city or country"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={toggleForm} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
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
                    <th className="px-6 py-3">City</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Discount</th>
                    <th className="px-6 py-3">Country</th>
                    <th className="px-6 py-3">Rating</th>
                    <th className="px-6 py-3">Quota</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-3">{item.city}</td>
                        <td className="px-6 py-3">{item.price}</td>
                        <td className="px-6 py-3">{item.discount}</td>
                        <td className="px-6 py-3">{item.country}</td>
                        <td className="px-6 py-3">{item.rating}</td>
                        <td className="px-6 py-3">{item.quota}</td>
                        <td className="px-6 py-3">
                          <button onClick={() => handleEdit(item.id)} className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 mr-2">
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
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                        {searchQuery ? 'No matching destinations found' : 'No destinations available'}
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
                Prev
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
            <form onSubmit={handleAddOrEditDestination} className="bg-white p-6 rounded-lg shadow-md w-1/3">
              <h3 className="text-xl font-semibold mb-4">{isEditing ? "Edit" : "Add"} Destination</h3>
              <label className="block mb-2"> City <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <label className="block mb-2"> Price <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <label className="block mb-2"> Discount <input type="text" name="discount" value={formData.discount} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <label className="block mb-2"> Country <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <label className="block mb-2"> Rating <input type="number" name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <label className="block mb-2"> Quota <input type="number" name="quota" value={formData.quota} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded" required /> </label>
              <div className="flex justify-end mt-4">
                <button type="button" onClick={handleCancel} className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition mr-2">
                  Cancel
                </button>
                <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition">
                  {isEditing ? 'Update' : 'Add'} Destination
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Destinationpage;