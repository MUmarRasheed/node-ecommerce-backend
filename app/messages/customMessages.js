let messages = {
  1000: "Something Went Wrong",
  1001: "API Does not exist",
  1002: "You don't have permission to do this operation",
  1003: "Validation Error",
  1004: "Invalid Request",
  1005: "User Not Found",
  1006: "Auth Error",
  1007: "Token is Expired or you are not logged in",
  1008: "DB Error",
  1009: "User Successfully Registered",
  1010: "Email is Already Registered",
  1011: "Phone is Already Registered",
  1012: "Incorrect Password",
  1013: "You are Successfully Logged In",
  1014: "User details fetched successfully",
  1015: "Error getting the user details",
  1016: "Successfully fetched the user list",
  1017: "Error in getting the user list",
  1018: "Your account is already verified.",
  1020: "Please check your mail to verify your account", // Send verification code
  1022: "Error in logging out",
  1023: "User logged out successfully",
  1024: "Error in deleting user",
  1025: "Account deleted successfully",
  1026: "Error in resend OTP",
  1027: "OTP sent successfully",
  1028: "We have emailed your password reset link!",
  1029: "Your password is updated.",
  1030: "Your token is expired. Please try again.",
  1031: "Your account is verified. You can now log in.", // Successful email verification
  1032: "Profile updated successfully",
  1033: "Error in getting all users",
  1034: "Successfully fetched all users",
  1035: "Bearer token not found",
  1036: "fileArray is empty",
  1037: "File uploaded successfully",
  1038: "Error in file uploading",
  1039: "Session expired",
  1040: "User activated successfully",
  1041: "User deactivated successfully",
  1042: "User already activated",
  1043: "User already deactivated",
  1044: "Your account has been blocked. Please contact support.",
  1045: "Account cannot be blocked. User has bookings",
  1046: "Account cannot be deleted. User has bookings",
  1047: "Account cannot be blocked while meetings are in progress.",

  1049: "Verification token is invalid or has expired.", // Invalid or expired token
  1050: "User email is not verified. Please check your email for verification link.", // Email not verified message,
  1051: "Email and password are invalid",
  1052: "Stock Created Successfully",
  1053: "Stock Retrieved Successfully",
  1054: "Stock List Retrieved Successfully",
  1055: "Stock Updated Successfully",
  1056: "Stock Deleted Successfully",
  1057: "Stock Not Found",
  1058: "Stock quantity must match the product's quantity.",
  1059: "This category has products. Use 'forceDelete' flag to delete it along with all products.",
  1060: "Shop created successfully.",
  1061: "Shop updated successfully.",
  1062: "Shop deleted successfully.",
  1063: "Shop retrieved successfully.",
  1064: "Shop list retrieved successfully.",
  1065: "Shop not found.",
  1066: "Product already exists in this shop.",
  1067: "This subcategory has products associated with it. Are you sure you want to delete it?",
  1068: "Product added to cart successfully.", // Success when adding to cart
  1069: "Cart item updated successfully.", // Success when updating a cart item
  1070: "Cart item removed successfully.", // Success when removing a cart item
  1071: "Cart is empty.", // When the cart has no items
  1072: "Insufficient stock for the requested product.", // When stock is insufficient
  1073: "Product not found in cart.", // When trying to update or delete a non-existing cart item
  1074: "Cart Item Fetched Successfully",
  1075: "error adding product to cart", 
  1076: "Cart Not Found", 
  1077: "Insufficient Stock",
  1078: "Address added successfully.",
  1079: "Addresses Fetched",
  1080: "Address not found.",
  1081: "Address updated successfully.",
  1082: "Address deleted successfully.",
  1083: "Failed to delete address.",
  1084: "Failed to update address.",
  1085: "Failed to add address.",
  1086: "Contact not found.",
  1087: "Invalid Payment Option",
  1088:  "No orders found.",
  1089: "Orders Fetched Successfully",
  1090: "Order not found.",
  1091:"Order status updated successfully",
  1092: "Checkout successful!",
  1093: "Shop Already Exist",
  1094: "Shop Registered Successfully",
  1095: "Shop in not Active",
  1096: "Shop Has Been Approved Successfully",
  1097: "Shop is already approved",
  1098: "Shop Deleted Successfully",
  1099: "You are not authorized to manage stock for this product.",
  1100: "Product added successfully to wishlist.",
  1101: "Product is already in your wishlist.",
  1102: "Product removed successfully from wishlist.",
  1103: "Wishlist retrieved successfully.",
  1104: "Wishlist cleared successfully.",
  1105: "Wishlist not found.",
  1106: "Product already in wishlist.",
  1107: "Order is already dispatched.",
  1108: "Order has been cancelled",
  1109: "Order has already been cancelled",
  1113: "Token Expired",
  1114: "Complaints not found.",                     // Complaint not found for specific queries
  1115: "Failed to retrieve complaints.",           // Retrieval error for complaints
  1116: "Complaint filed successfully.",            // Complaint created
  1117: "Complaint status updated successfully.",   // Status update success
  1118: "Complaint deleted successfully.",          // Complaint deletion success
  1119: "Complaints retreived successfully.",          // Complaint deletion success
  1120: "Complaint is already resolved.",
  1121: "A complaint for this product has already been submitted.",
  1122: "Old and new password cannot be same",
  1123: "Password didn't match",
  1124: "Password changed successfully",
  
  2001: "Category created successfully",
  2002: "Category list fetched successfully",
  2003: "Category not found",
  2004: "Category updated successfully",
  2005: "Category deleted successfully",

  2006: "Subcategory added successfully",
  2007: "Subcategory removed successfully",
  2008: "Subcategory list fetched successfully",
  2009: "Subcategory not found",

  2010: "Product Created",
  2011: "Product Retrieved",
  2012: "Product List Retrieved",
  2013: "Product Updated",
  2014: "Product Deleted",
  2015: "Product Not Found",
  2016: "Category Already Exist",
 2017:  "Stock with this title already exists for the product."
};

module.exports = messages;
