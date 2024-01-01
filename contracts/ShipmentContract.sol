// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Khai báo contract
contract ShipmentContract {
    // Struct để lưu trữ thông tin của một lô hàng
    struct Shipment {
        uint256 trackingNumber;
        address sender;
        address receiver;
        string status;
        string location;
    }

    // Mapping để ánh xạ tracking number với thông tin của lô hàng
    mapping(uint256 => Shipment) public shipments;

    // Function để tạo một lô hàng mới
    function createShipment(uint256 _trackingNumber, address _receiver, string memory _status, string memory _location) public {
        // Kiểm tra xem lô hàng đã tồn tại chưa
        require(shipments[_trackingNumber].trackingNumber != _trackingNumber, "Shipment already exists");

        // Tạo một lô hàng mới với thông tin người gửi, người nhận, số theo dõi, trạng thái và vị trí
        shipments[_trackingNumber] = Shipment(_trackingNumber, msg.sender, _receiver, _status, _location);
    }

    // Function để cập nhật trạng thái và vị trí của lô hàng
    function updateShipment(uint256 _trackingNumber, string memory _status, string memory _location) public {
        // Kiểm tra xem lô hàng đã tồn tại chưa
        require(shipments[_trackingNumber].trackingNumber == _trackingNumber, "Shipment does not exist");

        // Kiểm tra xem người gọi function có quyền cập nhật không
        require(msg.sender == shipments[_trackingNumber].sender || msg.sender == shipments[_trackingNumber].receiver, "You are not authorized");

        // Cập nhật trạng thái và vị trí của lô hàng
        shipments[_trackingNumber].status = _status;
        shipments[_trackingNumber].location = _location;
    }

    // Function để lấy thông tin của một lô hàng dựa trên số theo dõi
    function getShipment(uint256 _trackingNumber) public view returns (uint256, address, address, string memory, string memory) {
        // Kiểm tra xem lô hàng đã tồn tại chưa
        require(shipments[_trackingNumber].trackingNumber == _trackingNumber, "Shipment does not exist");

        // Trả về thông tin của lô hàng
        return (
            shipments[_trackingNumber].trackingNumber,
            shipments[_trackingNumber].sender,
            shipments[_trackingNumber].receiver,
            shipments[_trackingNumber].status,
            shipments[_trackingNumber].location
        );
    }
}
