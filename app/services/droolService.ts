import axios from 'axios';

const KIE_SERVER_BASE_URL = 'http://drools.codeinu.gr/rest';
const KIE_CONTAINER_ID = 'Substitution_GRC_1.0.0-SNAPSHOT';

export const fetchRules = async () => {
  try {
    const response = await axios.get(`${KIE_SERVER_BASE_URL}/containers/${KIE_CONTAINER_ID}/rules`, {
      auth: {
        username: 'wbadmin',
        password: 'wbadmin'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
};