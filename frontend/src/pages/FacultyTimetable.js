import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import TimetableGrid from '../components/Timetable/TimetableGrid';

const FacultyTimetable = () => {
  const { } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [faculty, setFaculty] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      // Get faculty profile by current user
      const facultyRes = await axios.get('/api/faculty/me');
      const myFaculty = facultyRes.data.data;
      setFaculty(myFaculty);
      
      if (!myFaculty || !myFaculty._id) {
        setError('Faculty profile not found. Please contact administrator.');
        setLoading(false);
        return;
      }
      
      // Get both published and approved timetables
      const [publishedRes, approvedRes] = await Promise.all([
        axios.get('/api/timetable?status=published'),
        axios.get('/api/timetable?status=approved')
      ]);
      
      const allTimetables = [
        ...(publishedRes.data.data || []),
        ...(approvedRes.data.data || [])
      ];
      
      console.log('All timetables:', allTimetables.length);
      console.log('My faculty ID:', myFaculty._id);
      
      // Filter timetables where this faculty is assigned
      const myTimetables = allTimetables.filter(tt => {
        if (!tt.entries || tt.entries.length === 0) {
          console.log('Timetable has no entries:', tt._id);
          return false;
        }
        
        const hasMyAssignment = tt.entries.some(entry => {
          // Handle both populated and unpopulated faculty references
          let entryFacultyId = null;
          if (entry.faculty) {
            entryFacultyId = entry.faculty._id || entry.faculty;
          }
          
          if (!entryFacultyId) {
            return false;
          }
          
          // Convert both to strings for comparison
          const myFacultyIdStr = myFaculty._id.toString();
          const entryFacultyIdStr = entryFacultyId.toString();
          
          const matches = entryFacultyIdStr === myFacultyIdStr;
          if (matches) {
            console.log('Found matching entry:', entry.entryID);
          }
          return matches;
        });
        
        if (hasMyAssignment) {
          console.log('Timetable has my assignments:', tt._id, tt.name);
        }
        return hasMyAssignment;
      });
      
      console.log('My timetables:', myTimetables.length);
      
      setTimetables(myTimetables);
      
      if (myTimetables.length > 0) {
        setSelectedTimetable(myTimetables[0]._id);
      } else {
        // Check if there are any timetables at all
        if (allTimetables.length > 0) {
          console.log('Timetables exist but none match my faculty ID');
          console.log('Sample timetable entries:', allTimetables[0]?.entries?.slice(0, 2));
        }
      }
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      if (error.response?.status === 404) {
        // Try refreshing once
        setTimeout(() => {
          fetchData();
        }, 1000);
        setError('Creating your faculty profile... Please wait.');
      } else {
        setError(`Failed to load timetable data: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMyEntries = (timetable) => {
    if (!timetable || !faculty) return [];
    return timetable.entries?.filter(entry => 
      entry.faculty?._id === faculty._id || 
      entry.faculty?.toString() === faculty._id.toString()
    ) || [];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (timetables.length === 0) {
    return (
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          My Timetable
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          No published or approved timetables found with your assignments. 
          {faculty && (
            <>
              <br />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your Faculty ID: {faculty.facultyID || faculty._id}
                <br />
                Department: {faculty.department}
              </Typography>
            </>
          )}
          <br />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please ensure:
            <ul>
              <li>Timetable has been generated and approved/published by admin</li>
              <li>You are assigned to subjects in the timetable</li>
              <li>Your faculty profile matches the assignments in the timetable</li>
            </ul>
            Contact administrator if the issue persists.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const currentTimetable = timetables.find(tt => tt._id === selectedTimetable);
  const myEntries = getMyEntries(currentTimetable);

  // Prepare data for TimetableGrid
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const uniqueTimeslots = [...new Set(myEntries.map(e => ({
    id: `${e.timeslot?.day}-${e.timeslot?.startTime}-${e.timeslot?.endTime}`,
    startTime: e.timeslot?.startTime,
    endTime: e.timeslot?.endTime,
  })))];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700}>
          My Timetable
        </Typography>
        {timetables.length > 1 && (
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Timetable</InputLabel>
            <Select
              value={selectedTimetable}
              onChange={(e) => setSelectedTimetable(e.target.value)}
              label="Select Timetable"
            >
              {timetables.map((tt) => (
                <MenuItem key={tt._id} value={tt._id}>
                  {tt.name} - {tt.academicYear}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {currentTimetable && (
        <>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              {currentTimetable.name}
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Chip label={`Academic Year: ${currentTimetable.academicYear}`} />
              <Chip label={`Semester: ${currentTimetable.semester}`} />
              <Chip label={`Department: ${currentTimetable.department}`} />
              <Chip label={`Total Classes: ${myEntries.length}`} color="primary" />
            </Box>
          </Box>

          {myEntries.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <TimetableGrid
                entries={myEntries}
                timeslots={uniqueTimeslots}
                days={days}
              />
            </Box>
          ) : (
            <Alert severity="info">
              No classes assigned to you in this timetable.
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default FacultyTimetable;

