const appDataSource = require('./dataSource');

const getProductDetailsByProductId = async (productId) => {

    try{
        return await appDataSource.query(`
        SELECT
            p.id,
            p.title,
            p.price,
            p.description,
            p.bed_quantity bed,
            p.bedroom_quantity bedroom,
            p.bathroom_quantity bathroom,
            p.guest_max guestMax,
            b.name buildingType,
            h.description hostDesc,
            c.name city,
            t.name theme,
            u.name hostName,
            JSON_OBJECT(
                'lat',p.latitude,
                'lng',p.longitude
            )coordinate,
            JSON_ARRAYAGG(i.url) imageUrl,
            (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'check_in',r.check_in,
                            'check_out',r.check_out
                        )
                    )
                FROM reservations r
                WHERE r.product_id = ${productId.productId}
            ) reservations,
            (
                SELECT 
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'check_in',holidays.start_date,
                            'check_out',holidays.end_date
                    )
                )FROM holidays
                WHERE holidays.product_id = ${productId.productId} 
            ) holidays
        FROM products p
        LEFT JOIN images i ON i.product_id = p.id
        LEFT JOIN hosts h ON p.host_id = h.id
        LEFT JOIN users u ON u.id = h.user_id
        LEFT JOIN cities c ON p.city_id = c.id
        LEFT JOIN themes t ON p.theme_id = t.id
        LEFT JOIN building_types b ON b.id = p.building_type_id
        WHERE p.id = ${productId.productId}
        `);
    }

    catch (err) {
        const error = new Error(err.message);
        error.statusCode = 500;
        throw error;
    }
}

const getFilteredOption = async (reservationDateOption, roomTypeOption, cityOption, priceOption, guestOption, limitOffsetOption) => {
    return await appDataSource.query(
    `
    SELECT DISTINCT
        p.id, 
        p.title, 
        p.price, 
        p.bed_quantity, 
        p.bathroom_quantity, 
        p.bedroom_quantity, 
        b.name building_type,
        c.name city,  
        t.name 테마유형, 
        p.guest_max,
        JSON_ARRAYAGG(i.url) image,
        reservations.reservedDates,
        longitude, 
        latitude
    FROM products p
    LEFT JOIN building_types b ON building_type_id = b.id
    LEFT JOIN cities c ON c.id = p.city_id 
    LEFT JOIN images i ON p.id = i.product_id
    LEFT JOIN themes t ON t.id = p.theme_id
    LEFT JOIN reservations r ON p.id = r.product_id
    LEFT JOIN (
        SELECT 
            r.product_id as productId,
            JSON_ARRAYAGG(
                JSON_OBJECT(
                    'check_in',r.check_in,
                    'check_out',r.check_out
                )
            ) reservedDates
    FROM reservations r
    JOIN products p on p.id = r.product_id
    ${reservationDateOption}
    ${roomTypeOption} 
    ${cityOption} 
    GROUP BY p.id, r.id
    ${priceOption} 
    ${guestOption}
    ${limitOffsetOption}
    `
   ) 
}


module.exports = {
    getProductDetailsByProductId,
    getFilteredOption
}

