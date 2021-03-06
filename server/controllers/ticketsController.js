/**
 * ************************************
 *
 * @author Joshua
 * @date 2/21/20
 * @description get tickets data from db middleware
 *
 * ************************************
 */

// import access to database
const db = require('../models/userModel');

const ticketsController = {};

ticketsController.getActiveTickets = (req, res, next) => {
  const getActiveTickets = `
    SELECT t._id, t.snaps_given, t.message, t.status, t.timestamp, t.mentee_id, u.name mentee_name
    FROM tickets t
    INNER JOIN users u
    ON u._id = t.mentee_id
    WHERE status = 'active'
    OR status = 'pending'
    ORDER BY t._id;
  `;
  db.query(getActiveTickets)
    .then(({ rows }) => {
      const formatTickets = rows.map(ticket => ({
        messageInput: ticket.message,
        messageRating: ticket.snaps_given,
        messageId: ticket._id,
        menteeId: ticket.mentee_id,
        menteeName: ticket.mentee_name,
        timestamp: ticket.timpestamp,
        status: ticket.status,
        mentorId: ticket.mentor_id || '',
      }))
      res.locals.activeTickets = formatTickets;
      return next();
    })
    .catch(err => next({
      log: `Error in middleware ticketsController.addNewTicket: ${err}`
    }))
}

ticketsController.addTicket = (req, res, next) => {
  const { snaps_given, mentee_id, status, message } = req.body;
  const addTicket = {
    text: `
      INSERT INTO tickets
      (snaps_given, mentee_id, status, message, timestamp)
      VALUES
      ($1, $2, $3, $4, NOW())
      RETURNING _id, timestamp, mentee_id;
    `,
    values: [snaps_given, mentee_id, status, message]
  }
  db.query(addTicket)
    .then(ticket => {
      res.locals.ticketId = ticket.rows[0]._id;
      res.locals.timestamp = ticket.rows[0].timestamp;
      res.locals.menteeId = ticket.rows[0].mentee_id;
      return next();
    })
    .catch(err => next({
      log: `Error in middleware ticketsController.addNewTicket: ${err}`
    }))
}


ticketsController.updateTicketStatus = (req, res, next) => {
  const { status, ticketId } = req.body;
  const updateTicket = {
    text: `
      UPDATE tickets
      SET status = $1
      WHERE _id = $2;
    `,
    values: [status, ticketId]
  }

  db.query(updateTicket)
    .then(success => next())
    .catch(err => next({
      log: `Error in middleware ticketsController.updateTicket: ${err}`
    }));
}


ticketsController.cancelTicket = (req, res, next) => {
  const { status, messageId, mentorId } = req.body;
  // const messageId = JSON.stringify(req.body.messageId);
  // const status = JSON.stringify(req.body.status);
  // const mentorId = JSON.stringify(req.body.mentorId);
  const cancelTicket = {
    text: `UPDATE tickets
    SET status = $1, mentor_id = $3
    WHERE _id = $2;`,
    values: [status, messageId, mentorId]
  };

  db.query(cancelTicket)
    .then(data => {
      return next();
    })
    .catch(err => next({
      log: `Error in middleware ticketsController.cancelTicket: ${err}`
    }));
}


ticketsController.acceptTicket = (req, res, next) => {
  const status = JSON.stringify(req.body.status);
  const messageId = JSON.stringify(req.body.messageId)
  const mentorId = JSON.stringify(req.body.mentorId);

  const text = `
UPDATE tickets
SET status = $1, mentor_id = $3
WHERE _id = $2;`;
  const values = [status, messageId, mentorId];

  db.query(text, values)
    .then((response) => {
      return next();
    })
    .catch(err => {
      console.log('Error: ', err);
      return next(err)
    });

}

module.exports = ticketsController;